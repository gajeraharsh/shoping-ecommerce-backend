const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Advanced search products
const searchProducts = async (req, res) => {
  try {
    const {
      q = '',
      category,
      brand,
      minPrice,
      maxPrice,
      size,
      color,
      sort = 'relevance',
      page = 1,
      limit = 12,
      inStock = false
    } = req.query;

    const skip = (page - 1) * limit;

    // Build search conditions
    const where = {
      isActive: true
    };

    // Text search
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { sku: { contains: q, mode: 'insensitive' } }
      ];
    }

    // Category filter
    if (category) {
      where.category = {
        slug: { in: category.split(',') }
      };
    }

    // Brand filter
    if (brand) {
      where.brand = {
        slug: { in: brand.split(',') }
      };
    }

    // Price range
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    // Stock filter
    if (inStock === 'true') {
      where.stock = { gt: 0 };
    }

    // Build sort conditions
    let orderBy = {};
    switch (sort) {
      case 'price-low':
        orderBy.price = 'asc';
        break;
      case 'price-high':
        orderBy.price = 'desc';
        break;
      case 'newest':
        orderBy.createdAt = 'desc';
        break;
      case 'popular':
        orderBy.rating = 'desc';
        break;
      case 'relevance':
      default:
        // For relevance, we'll use a combination of factors
        orderBy = [
          { isFeatured: 'desc' },
          { rating: 'desc' },
          { createdAt: 'desc' }
        ];
        break;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: true,
          brand: true,
          images: {
            orderBy: { sortOrder: 'asc' }
          },
          _count: {
            select: { reviews: true }
          }
        },
        orderBy,
        skip: parseInt(skip),
        take: parseInt(limit)
      }),
      prisma.product.count({ where })
    ]);

    // Get search facets
    const facets = await getSearchFacets(where);

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        },
        facets,
        query: q
      }
    });
  } catch (error) {
    console.error('Error searching products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search products'
    });
  }
};

// Get search facets
const getSearchFacets = async (baseWhere) => {
  try {
    const [categories, brands, priceRanges] = await Promise.all([
      // Categories
      prisma.category.findMany({
        where: { isActive: true },
        include: {
          _count: {
            select: {
              products: {
                where: baseWhere
              }
            }
          }
        },
        orderBy: { name: 'asc' }
      }),

      // Brands
      prisma.brand.findMany({
        where: { isActive: true },
        include: {
          _count: {
            select: {
              products: {
                where: baseWhere
              }
            }
          }
        },
        orderBy: { name: 'asc' }
      }),

      // Price ranges
      prisma.product.aggregate({
        where: baseWhere,
        _min: { price: true },
        _max: { price: true }
      })
    ]);

    return {
      categories: categories.filter(cat => cat._count.products > 0),
      brands: brands.filter(brand => brand._count.products > 0),
      priceRange: {
        min: priceRanges._min.price || 0,
        max: priceRanges._max.price || 0
      }
    };
  } catch (error) {
    console.error('Error getting search facets:', error);
    return { categories: [], brands: [], priceRange: { min: 0, max: 0 } };
  }
};

// Search autocomplete
const searchAutocomplete = async (req, res) => {
  try {
    const { q = '', limit = 5 } = req.query;

    if (!q || q.length < 2) {
      return res.json({
        success: true,
        data: []
      });
    }

    const results = await prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { sku: { contains: q, mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        images: {
          take: 1,
          orderBy: { sortOrder: 'asc' }
        },
        category: {
          select: { name: true, slug: true }
        }
      },
      take: parseInt(limit),
      orderBy: [
        { isFeatured: 'desc' },
        { rating: 'desc' }
      ]
    });

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Error in search autocomplete:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get search suggestions'
    });
  }
};

// Search suggestions
const getSearchSuggestions = async (req, res) => {
  try {
    const { q = '' } = req.query;

    if (!q || q.length < 2) {
      return res.json({
        success: true,
        data: {
          products: [],
          categories: [],
          brands: []
        }
      });
    }

    const [products, categories, brands] = await Promise.all([
      // Product suggestions
      prisma.product.findMany({
        where: {
          isActive: true,
          name: { contains: q, mode: 'insensitive' }
        },
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          images: {
            take: 1,
            orderBy: { sortOrder: 'asc' }
          }
        },
        take: 3,
        orderBy: { rating: 'desc' }
      }),

      // Category suggestions
      prisma.category.findMany({
        where: {
          isActive: true,
          name: { contains: q, mode: 'insensitive' }
        },
        select: {
          id: true,
          name: true,
          slug: true,
          image: true
        },
        take: 3
      }),

      // Brand suggestions
      prisma.brand.findMany({
        where: {
          isActive: true,
          name: { contains: q, mode: 'insensitive' }
        },
        select: {
          id: true,
          name: true,
          slug: true,
          logo: true
        },
        take: 3
      })
    ]);

    res.json({
      success: true,
      data: {
        products,
        categories,
        brands
      }
    });
  } catch (error) {
    console.error('Error getting search suggestions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get search suggestions'
    });
  }
};

// Get popular searches
const getPopularSearches = async (req, res) => {
  try {
    // This would typically come from a search analytics table
    // For now, we'll return some popular search terms
    const popularSearches = [
      'dresses',
      'shirts',
      'jeans',
      'shoes',
      'bags',
      'accessories',
      'ethnic wear',
      'western wear',
      'casual wear',
      'formal wear'
    ];

    res.json({
      success: true,
      data: popularSearches
    });
  } catch (error) {
    console.error('Error getting popular searches:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get popular searches'
    });
  }
};

// Get trending searches
const getTrendingSearches = async (req, res) => {
  try {
    // This would typically come from recent search analytics
    // For now, we'll return trending search terms
    const trendingSearches = [
      'summer collection',
      'party wear',
      'workout clothes',
      'winter jackets',
      'ethnic kurtis',
      'designer sarees',
      'casual sneakers',
      'formal shirts',
      'denim jackets',
      'maxi dresses'
    ];

    res.json({
      success: true,
      data: trendingSearches
    });
  } catch (error) {
    console.error('Error getting trending searches:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get trending searches'
    });
  }
};

module.exports = {
  searchProducts,
  searchAutocomplete,
  getSearchSuggestions,
  getPopularSearches,
  getTrendingSearches
}; 
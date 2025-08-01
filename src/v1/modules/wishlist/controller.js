const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');

const prisma = new PrismaClient();

// Validation schemas
const addToWishlistSchema = z.object({
  productId: z.string()
});

// Get user's wishlist
const getWishlist = async (req, res) => {
  try {
    const wishlistItems = await prisma.wishlist.findMany({
      where: { userId: req.user.id },
      include: {
        product: {
          include: {
            images: {
              orderBy: { sortOrder: 'asc' },
              take: 1
            },
            category: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: { wishlist: wishlistItems }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Add product to wishlist
const addToWishlist = async (req, res) => {
  try {
    const { productId } = addToWishlistSchema.parse(req.body);

    // Check if product exists and is active
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        isActive: true
      }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if already in wishlist
    const existingItem = await prisma.wishlist.findFirst({
      where: {
        userId: req.user.id,
        productId
      }
    });

    if (existingItem) {
      return res.status(400).json({
        success: false,
        message: 'Product already in wishlist'
      });
    }

    // Add to wishlist
    const wishlistItem = await prisma.wishlist.create({
      data: {
        userId: req.user.id,
        productId
      },
      include: {
        product: {
          include: {
            images: {
              orderBy: { sortOrder: 'asc' },
              take: 1
            },
            category: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Product added to wishlist successfully',
      data: { wishlistItem }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Remove product from wishlist
const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    // Check if item exists in wishlist
    const wishlistItem = await prisma.wishlist.findFirst({
      where: {
        userId: req.user.id,
        productId
      }
    });

    if (!wishlistItem) {
      return res.status(404).json({
        success: false,
        message: 'Product not found in wishlist'
      });
    }

    await prisma.wishlist.delete({
      where: { id: wishlistItem.id }
    });

    res.json({
      success: true,
      message: 'Product removed from wishlist successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Check if product is in wishlist
const checkWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    const wishlistItem = await prisma.wishlist.findFirst({
      where: {
        userId: req.user.id,
        productId
      }
    });

    res.json({
      success: true,
      data: { 
        isInWishlist: !!wishlistItem,
        wishlistItem: wishlistItem ? { id: wishlistItem.id } : null
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Clear entire wishlist
const clearWishlist = async (req, res) => {
  try {
    await prisma.wishlist.deleteMany({
      where: { userId: req.user.id }
    });

    res.json({
      success: true,
      message: 'Wishlist cleared successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Move wishlist item to cart
const moveToCart = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity = 1, size, color } = req.body;

    // Check if product exists in wishlist
    const wishlistItem = await prisma.wishlist.findFirst({
      where: {
        userId: req.user.id,
        productId
      },
      include: {
        product: true
      }
    });

    if (!wishlistItem) {
      return res.status(404).json({
        success: false,
        message: 'Product not found in wishlist'
      });
    }

    // Check stock availability
    if (wishlistItem.product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock'
      });
    }

    // Check if already in cart
    const existingCartItem = await prisma.cart.findFirst({
      where: {
        userId: req.user.id,
        productId,
        size: size || null,
        color: color || null
      }
    });

    if (existingCartItem) {
      // Update existing cart item
      const newQuantity = existingCartItem.quantity + quantity;
      
      if (wishlistItem.product.stock < newQuantity) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient stock for requested quantity'
        });
      }

      await prisma.cart.update({
        where: { id: existingCartItem.id },
        data: { quantity: newQuantity }
      });
    } else {
      // Create new cart item
      await prisma.cart.create({
        data: {
          userId: req.user.id,
          productId,
          quantity,
          size: size || null,
          color: color || null
        }
      });
    }

    // Remove from wishlist
    await prisma.wishlist.delete({
      where: { id: wishlistItem.id }
    });

    res.json({
      success: true,
      message: 'Product moved to cart successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  checkWishlist,
  clearWishlist,
  moveToCart
}; 
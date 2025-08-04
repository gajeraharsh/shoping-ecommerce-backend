const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');

const prisma = new PrismaClient();

// Get inventory overview
const getInventoryOverview = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      categoryId = '',
      lowStock = '',
      outOfStock = ''
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (categoryId) where.categoryId = categoryId;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take,
        include: {
          category: { select: { id: true, name: true } },
          variants: {
            select: {
              id: true,
              size: true,
              color: true,
              quantity: true,
              lowStockThreshold: true
            }
          }
        }
      }),
      prisma.product.count({ where })
    ]);

    const inventoryData = products.map(product => {
      const totalQuantity = product.variants.reduce((sum, v) => sum + v.quantity, 0);
      const lowStockCount = product.variants.filter(v => v.quantity <= (v.lowStockThreshold || 10) && v.quantity > 0).length;
      const outOfStockCount = product.variants.filter(v => v.quantity === 0).length;
      
      return {
        ...product,
        totalQuantity,
        lowStockCount,
        outOfStockCount,
        status: outOfStockCount > 0 ? 'OUT_OF_STOCK' : lowStockCount > 0 ? 'LOW_STOCK' : 'IN_STOCK'
      };
    });

    res.json({
      success: true,
      data: {
        inventory: inventoryData,
        pagination: {
          page: parseInt(page),
          limit: take,
          total,
          totalPages: Math.ceil(total / take),
          hasNext: parseInt(page) < Math.ceil(total / take),
          hasPrev: parseInt(page) > 1
        }
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

// Update variant inventory
const updateVariantInventory = async (req, res) => {
  try {
    const { variantId } = req.params;
    const { quantity, lowStockThreshold } = req.body;

    const variant = await prisma.productVariant.update({
      where: { id: variantId },
      data: {
        quantity: parseInt(quantity),
        lowStockThreshold: lowStockThreshold ? parseInt(lowStockThreshold) : undefined,
        updatedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Inventory updated successfully',
      data: variant
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get inventory statistics
const getInventoryStats = async (req, res) => {
  try {
    const stats = await prisma.$transaction([
      prisma.productVariant.aggregate({ _sum: { quantity: true } }),
      prisma.productVariant.count({ where: { quantity: 0 } }),
      prisma.productVariant.count({ where: { quantity: { lte: 10, gt: 0 } } }),
      prisma.product.count()
    ]);

    res.json({
      success: true,
      data: {
        totalStock: stats[0]._sum.quantity || 0,
        outOfStockVariants: stats[1],
        lowStockVariants: stats[2],
        totalProducts: stats[3]
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

module.exports = {
  getInventoryOverview,
  updateVariantInventory,
  getInventoryStats
};

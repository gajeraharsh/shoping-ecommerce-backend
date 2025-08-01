const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');

const prisma = new PrismaClient();

// Validation schemas
const addToCartSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().positive().default(1),
  size: z.string().optional(),
  color: z.string().optional()
});

const updateCartSchema = z.object({
  quantity: z.number().int().positive()
});

// Get user's cart
const getCart = async (req, res) => {
  try {
    const cartItems = await prisma.cart.findMany({
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

    // Calculate totals
    const subtotal = cartItems.reduce((total, item) => {
      return total + (parseFloat(item.product.price) * item.quantity);
    }, 0);

    const cartData = {
      items: cartItems,
      subtotal,
      itemCount: cartItems.length,
      totalItems: cartItems.reduce((total, item) => total + item.quantity, 0)
    };

    res.json({
      success: true,
      data: cartData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Add item to cart
const addToCart = async (req, res) => {
  try {
    const { productId, quantity, size, color } = addToCartSchema.parse(req.body);

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

    // Check stock availability
    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock'
      });
    }

    // Check if item already exists in cart
    const existingItem = await prisma.cart.findFirst({
      where: {
        userId: req.user.id,
        productId,
        size: size || null,
        color: color || null
      }
    });

    let cartItem;

    if (existingItem) {
      // Update existing item
      const newQuantity = existingItem.quantity + quantity;
      
      if (product.stock < newQuantity) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient stock for requested quantity'
        });
      }

      cartItem = await prisma.cart.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
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
    } else {
      // Create new cart item
      cartItem = await prisma.cart.create({
        data: {
          userId: req.user.id,
          productId,
          quantity,
          size: size || null,
          color: color || null
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
    }

    res.status(201).json({
      success: true,
      message: 'Item added to cart successfully',
      data: { cartItem }
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

// Update cart item quantity
const updateCartItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = updateCartSchema.parse(req.body);

    // Check if cart item exists and belongs to user
    const cartItem = await prisma.cart.findFirst({
      where: {
        id,
        userId: req.user.id
      },
      include: {
        product: true
      }
    });

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found'
      });
    }

    // Check stock availability
    if (cartItem.product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock'
      });
    }

    if (quantity === 0) {
      // Remove item if quantity is 0
      await prisma.cart.delete({
        where: { id }
      });

      return res.json({
        success: true,
        message: 'Item removed from cart'
      });
    }

    // Update quantity
    const updatedItem = await prisma.cart.update({
      where: { id },
      data: { quantity },
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

    res.json({
      success: true,
      message: 'Cart item updated successfully',
      data: { cartItem: updatedItem }
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

// Remove item from cart
const removeFromCart = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if cart item exists and belongs to user
    const cartItem = await prisma.cart.findFirst({
      where: {
        id,
        userId: req.user.id
      }
    });

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found'
      });
    }

    await prisma.cart.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Item removed from cart successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Clear entire cart
const clearCart = async (req, res) => {
  try {
    await prisma.cart.deleteMany({
      where: { userId: req.user.id }
    });

    res.json({
      success: true,
      message: 'Cart cleared successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get cart summary (for checkout)
const getCartSummary = async (req, res) => {
  try {
    const cartItems = await prisma.cart.findMany({
      where: { userId: req.user.id },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            stock: true,
            images: {
              orderBy: { sortOrder: 'asc' },
              take: 1,
              select: { url: true }
            }
          }
        }
      }
    });

    const subtotal = cartItems.reduce((total, item) => {
      return total + (parseFloat(item.product.price) * item.quantity);
    }, 0);

    const summary = {
      items: cartItems,
      subtotal,
      itemCount: cartItems.length,
      totalItems: cartItems.reduce((total, item) => total + item.quantity, 0)
    };

    res.json({
      success: true,
      data: summary
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
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  getCartSummary
}; 
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

// Get user profile
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        role: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error getting user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user profile'
    });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { firstName, lastName, phone, avatar } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName,
        lastName,
        phone,
        avatar
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        role: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({
      success: true,
      data: updatedUser,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user profile'
    });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    // Get current user with password
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password'
    });
  }
};

// Get user dashboard stats
const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const [
      totalOrders,
      totalSpent,
      wishlistCount,
      cartItemsCount,
      recentOrders,
      loyaltyPoints
    ] = await Promise.all([
      // Total orders
      prisma.order.count({
        where: { userId }
      }),
      
      // Total amount spent
      prisma.order.aggregate({
        where: { 
          userId,
          status: { in: ['DELIVERED', 'SHIPPED'] }
        },
        _sum: { total: true }
      }),
      
      // Wishlist count
      prisma.wishlist.count({
        where: { userId }
      }),
      
      // Cart items count
      prisma.cart.count({
        where: { userId }
      }),
      
      // Recent orders (last 5)
      prisma.order.findMany({
        where: { userId },
        include: {
          items: {
            include: {
              product: {
                include: {
                  images: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      }),
      
      // Loyalty points (mock calculation)
      prisma.order.aggregate({
        where: { 
          userId,
          status: { in: ['DELIVERED', 'SHIPPED'] }
        },
        _sum: { total: true }
      })
    ]);

    // Calculate loyalty points (1 point per ₹100 spent)
    const points = Math.floor((totalSpent._sum.total || 0) / 100);

    res.json({
      success: true,
      data: {
        totalOrders,
        totalSpent: totalSpent._sum.total || 0,
        wishlistCount,
        cartItemsCount,
        loyaltyPoints: points,
        recentOrders
      }
    });
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard stats'
    });
  }
};

// Get user activity
const getUserActivity = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 10, page = 1 } = req.query;
    const skip = (page - 1) * limit;

    const activities = await prisma.$queryRaw`
      SELECT 
        'order' as type,
        o.id,
        o.orderNumber,
        o.status,
        o.createdAt as date,
        o.total as amount,
        'Order placed' as title,
        CONCAT(o.orderNumber, ' - ', o.status) as description
      FROM orders o
      WHERE o.userId = ${userId}
      
      UNION ALL
      
      SELECT 
        'wishlist' as type,
        w.id,
        NULL as orderNumber,
        NULL as status,
        w.createdAt as date,
        NULL as amount,
        'Added to wishlist' as title,
        p.name as description
      FROM wishlist w
      JOIN products p ON w.productId = p.id
      WHERE w.userId = ${userId}
      
      UNION ALL
      
      SELECT 
        'review' as type,
        r.id,
        NULL as orderNumber,
        NULL as status,
        r.createdAt as date,
        NULL as amount,
        'Product review' as title,
        CONCAT(p.name, ' - ', r.rating, ' stars') as description
      FROM reviews r
      JOIN products p ON r.productId = p.id
      WHERE r.userId = ${userId}
      
      ORDER BY date DESC
      LIMIT ${parseInt(limit)}
      OFFSET ${parseInt(skip)}
    `;

    res.json({
      success: true,
      data: activities
    });
  } catch (error) {
    console.error('Error getting user activity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user activity'
    });
  }
};

// Get user preferences
const getUserPreferences = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's favorite categories based on order history
    const favoriteCategories = await prisma.$queryRaw`
      SELECT 
        c.id,
        c.name,
        c.slug,
        c.image,
        COUNT(oi.id) as orderCount
      FROM categories c
      JOIN products p ON c.id = p.categoryId
      JOIN order_items oi ON p.id = oi.productId
      JOIN orders o ON oi.orderId = o.id
      WHERE o.userId = ${userId}
      GROUP BY c.id, c.name, c.slug, c.image
      ORDER BY orderCount DESC
      LIMIT 5
    `;

    // Get user's favorite brands based on order history
    const favoriteBrands = await prisma.$queryRaw`
      SELECT 
        b.id,
        b.name,
        b.slug,
        b.logo,
        COUNT(oi.id) as orderCount
      FROM brands b
      JOIN products p ON b.id = p.brandId
      JOIN order_items oi ON p.id = oi.productId
      JOIN orders o ON oi.orderId = o.id
      WHERE o.userId = ${userId}
      GROUP BY b.id, b.name, b.slug, b.logo
      ORDER BY orderCount DESC
      LIMIT 5
    `;

    res.json({
      success: true,
      data: {
        favoriteCategories,
        favoriteBrands
      }
    });
  } catch (error) {
    console.error('Error getting user preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user preferences'
    });
  }
};

// Delete user account
const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    const { password } = req.body;

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Password is incorrect'
      });
    }

    // Delete user (this will cascade delete related data due to Prisma relations)
    await prisma.user.delete({
      where: { id: userId }
    });

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete account'
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  getDashboardStats,
  getUserActivity,
  getUserPreferences,
  deleteAccount
};
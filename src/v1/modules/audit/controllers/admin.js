const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');

const prisma = new PrismaClient();

// Validation schemas
const createAuditLogSchema = z.object({
  userId: z.string().optional(),
  action: z.string().min(1).max(50),
  resource: z.string().min(1).max(50),
  resourceId: z.string().optional(),
  oldValues: z.any().optional(),
  newValues: z.any().optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional()
});

// Get all audit logs with pagination and filters
const getAllAuditLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      userId = '',
      action = '',
      resource = '',
      startDate = '',
      endDate = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause
    const where = {};
    
    if (userId) where.userId = userId;
    if (action) where.action = { contains: action, mode: 'insensitive' };
    if (resource) where.resource = { contains: resource, mode: 'insensitive' };
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    // Get audit logs with pagination
    const [auditLogs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true
            }
          }
        }
      }),
      prisma.auditLog.count({ where })
    ]);

    const totalPages = Math.ceil(total / take);

    res.json({
      success: true,
      data: {
        auditLogs,
        pagination: {
          page: parseInt(page),
          limit: take,
          total,
          totalPages,
          hasNext: parseInt(page) < totalPages,
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

// Get single audit log by ID
const getAuditLogById = async (req, res) => {
  try {
    const { id } = req.params;

    const auditLog = await prisma.auditLog.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true
          }
        }
      }
    });

    if (!auditLog) {
      return res.status(404).json({
        success: false,
        message: 'Audit log not found'
      });
    }

    res.json({
      success: true,
      data: auditLog
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Create new audit log (internal use)
const createAuditLog = async (req, res) => {
  try {
    const auditData = createAuditLogSchema.parse(req.body);

    const auditLog = await prisma.auditLog.create({
      data: auditData,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Audit log created successfully',
      data: auditLog
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

// Delete audit log (admin only - for cleanup)
const deleteAuditLog = async (req, res) => {
  try {
    const { id } = req.params;

    const existingAuditLog = await prisma.auditLog.findUnique({
      where: { id }
    });

    if (!existingAuditLog) {
      return res.status(404).json({
        success: false,
        message: 'Audit log not found'
      });
    }

    await prisma.auditLog.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Audit log deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Bulk delete audit logs (cleanup old logs)
const bulkDeleteAuditLogs = async (req, res) => {
  try {
    const { olderThan } = req.body; // Date string

    if (!olderThan) {
      return res.status(400).json({
        success: false,
        message: 'olderThan date is required'
      });
    }

    const cutoffDate = new Date(olderThan);
    
    const result = await prisma.auditLog.deleteMany({
      where: {
        createdAt: { lt: cutoffDate }
      }
    });

    res.json({
      success: true,
      message: `${result.count} audit logs deleted successfully`,
      data: { deletedCount: result.count }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get audit log statistics
const getAuditStats = async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const stats = await prisma.$transaction([
      // Total audit logs
      prisma.auditLog.count(),
      // Today's logs
      prisma.auditLog.count({
        where: { createdAt: { gte: startOfDay } }
      }),
      // This week's logs
      prisma.auditLog.count({
        where: { createdAt: { gte: startOfWeek } }
      }),
      // This month's logs
      prisma.auditLog.count({
        where: { createdAt: { gte: startOfMonth } }
      }),
      // Logs by action
      prisma.auditLog.groupBy({
        by: ['action'],
        _count: true,
        orderBy: { _count: { action: 'desc' } },
        take: 10
      }),
      // Logs by resource
      prisma.auditLog.groupBy({
        by: ['resource'],
        _count: true,
        orderBy: { _count: { resource: 'desc' } },
        take: 10
      }),
      // Most active users
      prisma.auditLog.groupBy({
        by: ['userId'],
        _count: true,
        where: { userId: { not: null } },
        orderBy: { _count: { userId: 'desc' } },
        take: 10
      })
    ]);

    // Get user details for most active users
    const userIds = stats[6].map(item => item.userId).filter(Boolean);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, firstName: true, lastName: true, email: true }
    });

    const mostActiveUsers = stats[6].map(item => ({
      ...item,
      user: users.find(u => u.id === item.userId)
    }));

    res.json({
      success: true,
      data: {
        totalLogs: stats[0],
        todayLogs: stats[1],
        weekLogs: stats[2],
        monthLogs: stats[3],
        actionBreakdown: stats[4],
        resourceBreakdown: stats[5],
        mostActiveUsers
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

// Export audit logs (CSV format)
const exportAuditLogs = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      userId,
      action,
      resource
    } = req.query;
    
    const where = {};
    
    if (userId) where.userId = userId;
    if (action) where.action = { contains: action, mode: 'insensitive' };
    if (resource) where.resource = { contains: resource, mode: 'insensitive' };
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const auditLogs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      take: 10000 // Limit for performance
    });

    // Convert to CSV format
    const csvHeader = 'Date,User,Action,Resource,Resource ID,IP Address,User Agent\n';
    const csvData = auditLogs.map(log => {
      const userName = log.user ? `${log.user.firstName} ${log.user.lastName} (${log.user.email})` : 'System';
      return `${log.createdAt.toISOString()},${userName},${log.action},${log.resource},${log.resourceId || ''},${log.ipAddress || ''},${log.userAgent || ''}`;
    }).join('\n');

    const csv = csvHeader + csvData;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get activity timeline for a specific resource
const getResourceTimeline = async (req, res) => {
  try {
    const { resource, resourceId } = req.params;

    const auditLogs = await prisma.auditLog.findMany({
      where: {
        resource,
        resourceId
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: auditLogs
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
  getAllAuditLogs,
  getAuditLogById,
  createAuditLog,
  deleteAuditLog,
  bulkDeleteAuditLogs,
  getAuditStats,
  exportAuditLogs,
  getResourceTimeline
};

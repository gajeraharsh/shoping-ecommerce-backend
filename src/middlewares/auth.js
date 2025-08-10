/**
 * Authentication and Authorization Middleware
 * JWT token validation and role-based access control
 */

const jwt = require('jsonwebtoken');
const { HTTP_STATUS, MESSAGES, ROLES } = require('../utils/constants');
const { error } = require('../utils/response');
const prisma = require('../config/prisma');
const { notDeletedWhere } = require('../utils/softDelete');

/**
 * Verify JWT token and attach user to request
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return error(res, MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
    }

    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from database
      const user = await prisma.user.findUnique({
        where: notDeletedWhere({ id: decoded.id }),
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true
        }
      });

      if (!user) {
        return error(res, MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
      }

      req.user = user;
      next();
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return error(res, MESSAGES.TOKEN_EXPIRED, HTTP_STATUS.UNAUTHORIZED);
      }
      return error(res, MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
    }
  } catch (err) {
    return error(res, MESSAGES.INTERNAL_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
};

/**
 * Require specific role
 * @param {string} role - Required role (ADMIN, USER)
 */
const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return error(res, MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
    }

    if (req.user.role !== role) {
      return error(res, MESSAGES.FORBIDDEN, HTTP_STATUS.FORBIDDEN);
    }

    next();
  };
};

/**
 * Require admin role
 */
const requireAdmin = requireRole(ROLES.ADMIN);

/**
 * Require user role
 */
const requireUser = requireRole(ROLES.USER);

/**
 * Allow access to self or admin
 * Checks if the user is accessing their own resource or is an admin
 */
const requireSelfOrAdmin = (req, res, next) => {
  if (!req.user) {
    return error(res, MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
  }

  const userId = parseInt(req.params.userId || req.params.id);
  
  if (req.user.role === ROLES.ADMIN || req.user.id === userId) {
    return next();
  }

  return error(res, MESSAGES.FORBIDDEN, HTTP_STATUS.FORBIDDEN);
};

/**
 * Optional authentication - attach user if token is present but don't require it
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const user = await prisma.user.findUnique({
        where: notDeletedWhere({ id: decoded.id }),
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true
        }
      });

      if (user) {
        req.user = user;
      }
    } catch (jwtError) {
      // Ignore JWT errors for optional auth
    }

    next();
  } catch (err) {
    next();
  }
};

module.exports = {
  authenticate,
  requireRole,
  requireAdmin,
  requireUser,
  requireSelfOrAdmin,
  optionalAuth
};

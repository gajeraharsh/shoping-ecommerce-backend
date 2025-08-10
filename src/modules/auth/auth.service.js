/**
 * Authentication Service
 * Handles user registration, login, token management, and password operations
 */

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../../config/prisma');
const { notDeletedWhere } = require('../../utils/softDelete');
const { AppError } = require('../../middlewares/errorHandler');
const { HTTP_STATUS, MESSAGES } = require('../../utils/constants');
const { logger, auditLog } = require('../../utils/logger');

/**
 * Generate JWT tokens
 * @param {Object} payload - Token payload
 * @returns {Object} Access and refresh tokens
 */
const generateTokens = (payload) => {
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });

  const refreshToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
  });

  return { accessToken, refreshToken };
};

/**
 * Register new user
 * @param {Object} userData - User registration data
 * @returns {Object} User data and tokens
 */
const register = async (userData) => {
  const { email, password, name, role = 'USER' } = userData;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser && !existingUser.isDeleted) {
    throw new AppError(MESSAGES.DUPLICATE_EMAIL, HTTP_STATUS.CONFLICT);
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      role
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true
    }
  });

  // Generate tokens
  const tokens = generateTokens({ id: user.id, email: user.email, role: user.role });

  auditLog('USER_REGISTERED', user.id, { email, role });
  logger.info(`New user registered: ${email}`);

  return { user, ...tokens };
};

/**
 * Login user
 * @param {Object} loginData - Login credentials
 * @returns {Object} User data and tokens
 */
const login = async (loginData) => {
  const { email, password } = loginData;

  // Find user
  const user = await prisma.user.findUnique({
    where: notDeletedWhere({ email })
  });

  if (!user) {
    throw new AppError(MESSAGES.INVALID_CREDENTIALS, HTTP_STATUS.UNAUTHORIZED);
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new AppError(MESSAGES.INVALID_CREDENTIALS, HTTP_STATUS.UNAUTHORIZED);
  }

  // Generate tokens
  const tokens = generateTokens({ id: user.id, email: user.email, role: user.role });

  auditLog('USER_LOGIN', user.id, { email });
  logger.info(`User logged in: ${email}`);

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt
    },
    ...tokens
  };
};

/**
 * Refresh access token
 * @param {string} refreshToken - Refresh token
 * @returns {Object} New tokens
 */
const refreshToken = async (refreshToken) => {
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    
    // Verify user still exists
    const user = await prisma.user.findUnique({
      where: notDeletedWhere({ id: decoded.id })
    });

    if (!user) {
      throw new AppError(MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
    }

    // Generate new tokens
    const tokens = generateTokens({ id: user.id, email: user.email, role: user.role });

    return tokens;
  } catch (error) {
    throw new AppError(MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
  }
};

/**
 * Change user password
 * @param {number} userId - User ID
 * @param {Object} passwordData - Current and new password
 * @returns {Object} Success message
 */
const changePassword = async (userId, passwordData) => {
  const { currentPassword, newPassword } = passwordData;

  // Get user
  const user = await prisma.user.findUnique({
    where: notDeletedWhere({ id: userId })
  });

  if (!user) {
    throw new AppError(MESSAGES.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }

  // Verify current password
  const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
  if (!isCurrentPasswordValid) {
    throw new AppError('Current password is incorrect', HTTP_STATUS.BAD_REQUEST);
  }

  // Hash new password
  const hashedNewPassword = await bcrypt.hash(newPassword, 12);

  // Update password
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedNewPassword }
  });

  auditLog('PASSWORD_CHANGED', userId);
  logger.info(`Password changed for user: ${user.email}`);

  return { message: 'Password changed successfully' };
};

/**
 * Generate password reset token
 * @param {string} email - User email
 * @returns {Object} Reset token
 */
const forgotPassword = async (email) => {
  const user = await prisma.user.findUnique({
    where: notDeletedWhere({ email })
  });

  if (!user) {
    // Don't reveal if email exists
    return { message: 'If email exists, reset instructions have been sent' };
  }

  // Generate reset token (valid for 1 hour)
  const resetToken = jwt.sign(
    { id: user.id, email: user.email, type: 'password_reset' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  auditLog('PASSWORD_RESET_REQUESTED', user.id, { email });
  logger.info(`Password reset requested for: ${email}`);

  // In a real application, send email with reset token
  // For now, return the token (remove this in production)
  return { 
    message: 'If email exists, reset instructions have been sent',
    resetToken // Remove this in production
  };
};

/**
 * Reset password using token
 * @param {Object} resetData - Reset token and new password
 * @returns {Object} Success message
 */
const resetPassword = async (resetData) => {
  const { token, password } = resetData;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.type !== 'password_reset') {
      throw new AppError('Invalid reset token', HTTP_STATUS.BAD_REQUEST);
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update password
    await prisma.user.update({
      where: notDeletedWhere({ id: decoded.id }),
      data: { password: hashedPassword }
    });

    auditLog('PASSWORD_RESET_COMPLETED', decoded.id);
    logger.info(`Password reset completed for user: ${decoded.email}`);

    return { message: 'Password reset successfully' };
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new AppError('Reset token expired', HTTP_STATUS.BAD_REQUEST);
    }
    throw new AppError('Invalid reset token', HTTP_STATUS.BAD_REQUEST);
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  changePassword,
  forgotPassword,
  resetPassword
};

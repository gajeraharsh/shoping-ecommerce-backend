/**
 * Express Application Setup
 * Configures Express app with middleware, routes, and error handling
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { swaggerUi, specs, serve, setup } = require('./config/swagger');
const { errorHandler, notFound } = require('./middlewares/errorHandler');
const { logger } = require('./utils/logger');

// Import routes
const adminRoutes = require('./routes/admin.routes');
const userRoutes = require('./routes/user.routes');
const authRoutes = require('./modules/auth/auth.route');

const app = express();

// Trust proxy for rate limiting and IP detection
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use(limiter);

// Logging middleware
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// API Documentation
app.use('/docs', serve, setup);

// API Routes
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/api', userRoutes);

// 404 handler for unmatched routes
app.use(notFound);

// Global error handler
app.use(errorHandler);

module.exports = app;

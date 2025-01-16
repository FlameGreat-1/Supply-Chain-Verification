require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');
const compression = require('compression');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { ValidationError } = require('./src/utils/errors');
const logger = require('./src/utils/logger');
const connectDB = require('./src/config/database');
const { connectToBlockchain } = require('./src/config/blockchain-connection');

// Import routes
const productRoutes = require('./src/api/routes/product.routes');
const userRoutes = require('./src/api/routes/user.routes');
const analyticsRoutes = require('./src/api/routes/analytics.routes');

// Create Express app
const app = express();

// Connect to MongoDB
connectDB();

// Connect to Blockchain network
connectToBlockchain().catch(err => {
    logger.error(`Failed to connect to blockchain network: ${err}`);
    process.exit(1);
});

// Middleware
app.use(helmet()); // Set security HTTP headers
app.use(xss()); // Sanitize request data
app.use(mongoSanitize()); // Sanitize data against NoSQL query injection
app.use(compression()); // Compress all routes
app.use(express.json({ limit: '10kb' })); // Body parser, reading data from body into req.body
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cors()); // Enable CORS
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } })); // HTTP request logger

// Rate limiting
const limiter = rateLimit({
    max: 100, // Limit each IP to 100 requests per windowMs
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: 'Too many requests from this IP, please try again in 15 minutes!'
});
app.use('/api', limiter);

// Routes
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/analytics', analyticsRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP' });
});

// 404 Error handler
app.use((req, res, next) => {
    const error = new Error('Not Found');
    error.status = 404;
    next(error);
});

// Global error handler
app.use((err, req, res, next) => {
    if (err instanceof ValidationError) {
        return res.status(400).json({
            status: 'error',
            message: err.message
        });
    }

    logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);

    res.status(err.status || 500).json({
        status: 'error',
        message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message
    });
});

// Start server
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    logger.error(`Unhandled Rejection: ${err.message}`);
    // Close server & exit process
    server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    logger.error(`Uncaught Exception: ${err.message}`);
    // Close server & exit process
    server.close(() => process.exit(1));
});

module.exports = server; // For testing purposes

const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const config = require('../../config/config');
const userService = require('../services/user.service');
const logger = require('../../utils/logger');
const { AuthenticationError, AuthorizationError } = require('../../utils/errors');

exports.authenticate = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            throw new AuthenticationError('You are not logged in. Please log in to get access.');
        }

        const decoded = await promisify(jwt.verify)(token, config.jwtSecret);

        const user = await userService.getUserById(decoded.id);
        if (!user) {
            throw new AuthenticationError('The user belonging to this token no longer exists.');
        }

        if (user.passwordChangedAt && decoded.iat < user.passwordChangedAt.getTime() / 1000) {
            throw new AuthenticationError('User recently changed password. Please log in again.');
        }

        if (!user.isActive) {
            throw new AuthenticationError('This user account has been deactivated.');
        }

        req.user = user;
        next();
    } catch (error) {
        logger.error(`Authentication error: ${error.message}`);
        next(error);
    }
};

exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new AuthorizationError('You do not have permission to perform this action'));
        }
        next();
    };
};

exports.rateLimiter = (maxRequests, perMinutes) => {
    const requests = new Map();
    
    return (req, res, next) => {
        const ip = req.ip;
        const now = Date.now();
        const windowStart = now - perMinutes * 60 * 1000;
        
        const requestTimestamps = requests.get(ip) || [];
        const requestsInWindow = requestTimestamps.filter(timestamp => timestamp > windowStart);
        
        if (requestsInWindow.length >= maxRequests) {
            return next(new AuthorizationError('Too many requests, please try again later.'));
        }
        
        requestTimestamps.push(now);
        requests.set(ip, requestTimestamps);
        
        next();
    };
};

exports.csrfProtection = (req, res, next) => {
    const csrfToken = req.headers['x-csrf-token'];
    if (!csrfToken || csrfToken !== req.session.csrfToken) {
        return next(new AuthenticationError('Invalid CSRF token'));
    }
    next();
};

exports.secureHeaders = (req, res, next) => {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';");
    next();
};

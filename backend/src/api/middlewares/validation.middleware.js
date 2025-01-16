const { body, param, query, validationResult } = require('express-validator');
const { ValidationError } = require('../../utils/errors');

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(error => error.msg);
        throw new ValidationError(errorMessages.join(', '));
    }
    next();
};

exports.validateProductCreation = [
    body('name').notEmpty().withMessage('Product name is required'),
    body('manufacturer').notEmpty().withMessage('Manufacturer is required'),
    body('manufacturingDate').isISO8601().toDate().withMessage('Invalid manufacturing date'),
    body('batchNumber').notEmpty().withMessage('Batch number is required'),
    handleValidationErrors
];

exports.validateProductUpdate = [
    param('productId').isMongoId().withMessage('Invalid product ID'),
    body('name').optional().notEmpty().withMessage('Product name cannot be empty'),
    body('manufacturer').optional().notEmpty().withMessage('Manufacturer cannot be empty'),
    body('manufacturingDate').optional().isISO8601().toDate().withMessage('Invalid manufacturing date'),
    body('batchNumber').optional().notEmpty().withMessage('Batch number cannot be empty'),
    handleValidationErrors
];

exports.validateProductTransfer = [
    param('productId').isMongoId().withMessage('Invalid product ID'),
    body('newOwner').isMongoId().withMessage('Invalid new owner ID'),
    body('location').notEmpty().withMessage('Location is required'),
    handleValidationErrors
];

exports.validateProductVerification = [
    param('productId').isMongoId().withMessage('Invalid product ID'),
    body('verificationCode').notEmpty().withMessage('Verification code is required'),
    handleValidationErrors
];

exports.validateCertificationAddition = [
    param('productId').isMongoId().withMessage('Invalid product ID'),
    body('certificationBody').notEmpty().withMessage('Certification body is required'),
    body('certificationDate').isISO8601().toDate().withMessage('Invalid certification date'),
    body('expirationDate').isISO8601().toDate().withMessage('Invalid expiration date'),
    body('certificationDetails').isObject().withMessage('Certification details must be an object'),
    handleValidationErrors
];

exports.validateEthicalScoreAddition = [
    param('productId').isMongoId().withMessage('Invalid product ID'),
    body('scoreCategory').notEmpty().withMessage('Score category is required'),
    body('score').isFloat({ min: 0, max: 100 }).withMessage('Score must be between 0 and 100'),
    body('assessmentDate').isISO8601().toDate().withMessage('Invalid assessment date'),
    handleValidationErrors
];

exports.validateUserRegistration = [
    body('username').notEmpty().withMessage('Username is required'),
    body('email').isEmail().withMessage('Invalid email address'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
    body('role').isIn(['user', 'admin', 'manufacturer', 'distributor', 'retailer', 'certifier', 'assessor']).withMessage('Invalid role'),
    body('companyName').optional().notEmpty().withMessage('Company name cannot be empty'),
    body('companyAddress').optional().notEmpty().withMessage('Company address cannot be empty'),
    handleValidationErrors
];

exports.validateUserLogin = [
    body('email').isEmail().withMessage('Invalid email address'),
    body('password').notEmpty().withMessage('Password is required'),
    handleValidationErrors
];

exports.validateProfileUpdate = [
    body('username').optional().notEmpty().withMessage('Username cannot be empty'),
    body('companyName').optional().notEmpty().withMessage('Company name cannot be empty'),
    body('companyAddress').optional().notEmpty().withMessage('Company address cannot be empty'),
    handleValidationErrors
];

exports.validatePasswordChange = [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters long'),
    handleValidationErrors
];

exports.validateEmailForReset = [
    body('email').isEmail().withMessage('Invalid email address'),
    handleValidationErrors
];

exports.validatePasswordReset = [
    body('token').notEmpty().withMessage('Reset token is required'),
    body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters long'),
    handleValidationErrors
];

exports.validateUserId = [
    param('userId').isMongoId().withMessage('Invalid user ID'),
    handleValidationErrors
];

exports.validateRoleUpdate = [
    param('userId').isMongoId().withMessage('Invalid user ID'),
    body('role').isIn(['user', 'admin', 'manufacturer', 'distributor', 'retailer', 'certifier', 'assessor']).withMessage('Invalid role'),
    handleValidationErrors
];

exports.validateProductSearch = [
    query('query').optional().notEmpty().withMessage('Search query cannot be empty'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('sortBy').optional().isIn(['name', 'manufacturer', 'createdAt']).withMessage('Invalid sort field'),
    query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Invalid sort order'),
    handleValidationErrors
];

exports.validateDateRange = [
    query('startDate').isISO8601().toDate().withMessage('Invalid start date'),
    query('endDate').isISO8601().toDate().withMessage('Invalid end date'),
    handleValidationErrors
];

exports.validateCustomReportRequest = [
    body('startDate').isISO8601().toDate().withMessage('Invalid start date'),
    body('endDate').isISO8601().toDate().withMessage('Invalid end date'),
    body('metrics').isArray().withMessage('Metrics must be an array'),
    body('metrics.*').isIn(['traceability', 'ethicalSourcing', 'certifications', 'userActivity', 'transferPatterns', 'fraudDetection', 'sustainability']).withMessage('Invalid metric'),
    handleValidationErrors
];

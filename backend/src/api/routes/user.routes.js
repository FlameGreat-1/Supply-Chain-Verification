// src/api/routes/user.routes.js

const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const validationMiddleware = require('../middlewares/validation.middleware');

// User registration
router.post(
  '/register',
  validationMiddleware.validateUserRegistration,
  userController.registerUser
);

// User login
router.post(
  '/login',
  validationMiddleware.validateUserLogin,
  userController.loginUser
);

// Get user profile
router.get(
  '/profile',
  authMiddleware.authenticate,
  userController.getUserProfile
);

// Update user profile
router.put(
  '/profile',
  authMiddleware.authenticate,
  validationMiddleware.validateProfileUpdate,
  userController.updateUserProfile
);

// Change password
router.put(
  '/change-password',
  authMiddleware.authenticate,
  validationMiddleware.validatePasswordChange,
  userController.changePassword
);

// Request password reset
router.post(
  '/forgot-password',
  validationMiddleware.validateEmailForReset,
  userController.requestPasswordReset
);

// Reset password
router.post(
  '/reset-password',
  validationMiddleware.validatePasswordReset,
  userController.resetPassword
);

// Get all users (admin only)
router.get(
  '/',
  authMiddleware.authenticate,
  authMiddleware.authorize(['admin']),
  userController.getAllUsers
);

// Get user by ID (admin only)
router.get(
  '/:userId',
  authMiddleware.authenticate,
  authMiddleware.authorize(['admin']),
  validationMiddleware.validateUserId,
  userController.getUserById
);

// Update user role (admin only)
router.put(
  '/:userId/role',
  authMiddleware.authenticate,
  authMiddleware.authorize(['admin']),
  validationMiddleware.validateRoleUpdate,
  userController.updateUserRole
);

// Deactivate user (admin only)
router.put(
  '/:userId/deactivate',
  authMiddleware.authenticate,
  authMiddleware.authorize(['admin']),
  validationMiddleware.validateUserId,
  userController.deactivateUser
);

// Reactivate user (admin only)
router.put(
  '/:userId/reactivate',
  authMiddleware.authenticate,
  authMiddleware.authorize(['admin']),
  validationMiddleware.validateUserId,
  userController.reactivateUser
);

module.exports = router;

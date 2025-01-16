const userService = require('../services/user.service');
const authService = require('../services/auth.service');
const logger = require('../../utils/logger');
const { ValidationError } = require('../../utils/errors');

exports.registerUser = async (req, res, next) => {
    try {
        const { username, email, password, role, companyName, companyAddress } = req.body;
        
        const existingUser = await userService.getUserByEmail(email);
        if (existingUser) {
            throw new ValidationError('Email already in use');
        }

        const user = await userService.createUser({
            username,
            email,
            password,
            role,
            companyName,
            companyAddress
        });

        const token = authService.generateToken(user);

        logger.info(`New user registered: ${user.id}`);
        res.status(201).json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role
                },
                token
            }
        });
    } catch (error) {
        logger.error(`Error registering user: ${error.message}`);
        next(error);
    }
};

exports.loginUser = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const user = await userService.getUserByEmail(email);
        if (!user || !(await userService.verifyPassword(user, password))) {
            throw new ValidationError('Invalid credentials');
        }

        if (!user.isActive) {
            throw new ValidationError('Account is deactivated. Please contact support.');
        }

        const token = authService.generateToken(user);

        await userService.updateLastLogin(user.id);

        logger.info(`User logged in: ${user.id}`);
        res.status(200).json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role
                },
                token
            }
        });
    } catch (error) {
        logger.error(`Error logging in user: ${error.message}`);
        next(error);
    }
};

exports.getUserProfile = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const user = await userService.getUserById(userId);

        if (!user) {
            throw new ValidationError('User not found');
        }

        res.status(200).json({
            success: true,
            data: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                companyName: user.companyName,
                companyAddress: user.companyAddress,
                createdAt: user.createdAt,
                lastLogin: user.lastLogin
            }
        });
    } catch (error) {
        logger.error(`Error fetching user profile: ${error.message}`);
        next(error);
    }
};

exports.updateUserProfile = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { username, companyName, companyAddress } = req.body;

        const updatedUser = await userService.updateUser(userId, {
            username,
            companyName,
            companyAddress
        });

        if (!updatedUser) {
            throw new ValidationError('User not found');
        }

        logger.info(`User profile updated: ${userId}`);
        res.status(200).json({
            success: true,
            data: {
                id: updatedUser.id,
                username: updatedUser.username,
                email: updatedUser.email,
                role: updatedUser.role,
                companyName: updatedUser.companyName,
                companyAddress: updatedUser.companyAddress
            }
        });
    } catch (error) {
        logger.error(`Error updating user profile: ${error.message}`);
        next(error);
    }
};

exports.changePassword = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { currentPassword, newPassword } = req.body;

        const user = await userService.getUserById(userId);
        if (!user || !(await userService.verifyPassword(user, currentPassword))) {
            throw new ValidationError('Invalid current password');
        }

        await userService.updatePassword(userId, newPassword);

        logger.info(`Password changed for user: ${userId}`);
        res.status(200).json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        logger.error(`Error changing password: ${error.message}`);
        next(error);
    }
};

exports.requestPasswordReset = async (req, res, next) => {
    try {
        const { email } = req.body;
        const user = await userService.getUserByEmail(email);

        if (user) {
            const resetToken = await authService.generatePasswordResetToken(user);
            await userService.sendPasswordResetEmail(user.email, resetToken);
        }

        // Always return a success message to prevent email enumeration
        res.status(200).json({ success: true, message: 'If the email exists, a password reset link has been sent.' });
    } catch (error) {
        logger.error(`Error requesting password reset: ${error.message}`);
        next(error);
    }
};

exports.resetPassword = async (req, res, next) => {
    try {
        const { token, newPassword } = req.body;
        const userId = await authService.verifyPasswordResetToken(token);

        if (!userId) {
            throw new ValidationError('Invalid or expired reset token');
        }

        await userService.updatePassword(userId, newPassword);
        await authService.invalidatePasswordResetToken(token);

        logger.info(`Password reset for user: ${userId}`);
        res.status(200).json({ success: true, message: 'Password has been reset successfully' });
    } catch (error) {
        logger.error(`Error resetting password: ${error.message}`);
        next(error);
    }
};

exports.getAllUsers = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
        const users = await userService.getAllUsers(page, limit, sortBy, sortOrder);

        res.status(200).json({
            success: true,
            data: users.map(user => ({
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                isActive: user.isActive,
                createdAt: user.createdAt,
                lastLogin: user.lastLogin
            })),
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: await userService.getUserCount()
            }
        });
    } catch (error) {
        logger.error(`Error fetching all users: ${error.message}`);
        next(error);
    }
};

exports.getUserById = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const user = await userService.getUserById(userId);

        if (!user) {
            throw new ValidationError('User not found');
        }

        res.status(200).json({
            success: true,
            data: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                companyName: user.companyName,
                companyAddress: user.companyAddress,
                isActive: user.isActive,
                createdAt: user.createdAt,
                lastLogin: user.lastLogin
            }
        });
    } catch (error) {
        logger.error(`Error fetching user by ID: ${error.message}`);
        next(error);
    }
};

exports.updateUserRole = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const { role } = req.body;

        const updatedUser = await userService.updateUserRole(userId, role);

        if (!updatedUser) {
            throw new ValidationError('User not found');
        }

        logger.info(`User role updated: ${userId} to ${role}`);
        res.status(200).json({
            success: true,
            data: {
                id: updatedUser.id,
                username: updatedUser.username,
                email: updatedUser.email,
                role: updatedUser.role
            }
        });
    } catch (error) {
        logger.error(`Error updating user role: ${error.message}`);
        next(error);
    }
};

exports.deactivateUser = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const deactivatedUser = await userService.deactivateUser(userId);

        if (!deactivatedUser) {
            throw new ValidationError('User not found');
        }

        logger.info(`User deactivated: ${userId}`);
        res.status(200).json({ success: true, message: 'User deactivated successfully' });
    } catch (error) {
        logger.error(`Error deactivating user: ${error.message}`);
        next(error);
    }
};

exports.reactivateUser = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const reactivatedUser = await userService.reactivateUser(userId);

        if (!reactivatedUser) {
            throw new ValidationError('User not found');
        }

        logger.info(`User reactivated: ${userId}`);
        res.status(200).json({ success: true, message: 'User reactivated successfully' });
    } catch (error) {
        logger.error(`Error reactivating user: ${error.message}`);
        next(error);
    }
};

const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const logger = require('../../utils/logger');
const { ValidationError } = require('../../utils/errors');
const emailService = require('./email.service');

class UserService {
    async createUser(userData) {
        try {
            const user = new User(userData);
            await user.save();
            return user;
        } catch (error) {
            logger.error(`Error creating user: ${error.message}`);
            throw new ValidationError('Failed to create user');
        }
    }

    async getUserById(userId) {
        try {
            const user = await User.findById(userId).select('-password');
            if (!user) {
                throw new ValidationError('User not found');
            }
            return user;
        } catch (error) {
            logger.error(`Error fetching user: ${error.message}`);
            throw new ValidationError('Failed to fetch user');
        }
    }

    async getUserByEmail(email) {
        try {
            return await User.findOne({ email });
        } catch (error) {
            logger.error(`Error fetching user by email: ${error.message}`);
            throw new ValidationError('Failed to fetch user');
        }
    }

    async updateUser(userId, updateData) {
        try {
            const user = await User.findByIdAndUpdate(userId, updateData, { new: true, runValidators: true }).select('-password');
            if (!user) {
                throw new ValidationError('User not found');
            }
            return user;
        } catch (error) {
            logger.error(`Error updating user: ${error.message}`);
            throw new ValidationError('Failed to update user');
        }
    }

    async verifyPassword(user, password) {
        return await bcrypt.compare(password, user.password);
    }

    async updatePassword(userId, newPassword) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new ValidationError('User not found');
            }
            user.password = newPassword;
            await user.save();
        } catch (error) {
            logger.error(`Error updating password: ${error.message}`);
            throw new ValidationError('Failed to update password');
        }
    }

    async getAllUsers(page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc') {
        try {
            const options = {
                page: parseInt(page),
                limit: parseInt(limit),
                sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 },
                select: '-password'
            };

            const users = await User.paginate({}, options);
            return users;
        } catch (error) {
            logger.error(`Error fetching all users: ${error.message}`);
            throw new ValidationError('Failed to fetch users');
        }
    }

    async getUserCount() {
        try {
            return await User.countDocuments();
        } catch (error) {
            logger.error(`Error getting user count: ${error.message}`);
            throw new ValidationError('Failed to get user count');
        }
    }

    async updateUserRole(userId, role) {
        try {
            const user = await User.findByIdAndUpdate(userId, { role }, { new: true, runValidators: true }).select('-password');
            if (!user) {
                throw new ValidationError('User not found');
            }
            return user;
        } catch (error) {
            logger.error(`Error updating user role: ${error.message}`);
            throw new ValidationError('Failed to update user role');
        }
    }

    async deactivateUser(userId) {
        try {
            const user = await User.findByIdAndUpdate(userId, { isActive: false }, { new: true }).select('-password');
            if (!user) {
                throw new ValidationError('User not found');
            }
            return user;
        } catch (error) {
            logger.error(`Error deactivating user: ${error.message}`);
            throw new ValidationError('Failed to deactivate user');
        }
    }

    async reactivateUser(userId) {
        try {
            const user = await User.findByIdAndUpdate(userId, { isActive: true }, { new: true }).select('-password');
            if (!user) {
                throw new ValidationError('User not found');
            }
            return user;
        } catch (error) {
            logger.error(`Error reactivating user: ${error.message}`);
            throw new ValidationError('Failed to reactivate user');
        }
    }

    async sendPasswordResetEmail(email, resetToken) {
        try {
            const resetURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
            await emailService.sendEmail({
                to: email,
                subject: 'Password Reset Request',
                text: `Please use the following link to reset your password: ${resetURL}. This link will expire in 1 hour.`
            });
        } catch (error) {
            logger.error(`Error sending password reset email: ${error.message}`);
            throw new ValidationError('Failed to send password reset email');
        }
    }

    async updateLastLogin(userId) {
        try {
            await User.findByIdAndUpdate(userId, { lastLogin: Date.now() });
        } catch (error) {
            logger.error(`Error updating last login: ${error.message}`);
        }
    }
}

module.exports = new UserService();

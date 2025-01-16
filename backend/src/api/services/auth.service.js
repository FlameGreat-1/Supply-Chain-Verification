const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../../config/config');
const logger = require('../../utils/logger');

class AuthService {
    generateToken(user) {
        return jwt.sign(
            { id: user._id, role: user.role },
            config.jwtSecret,
            { expiresIn: config.jwtExpiresIn }
        );
    }

    async generatePasswordResetToken(user) {
        const resetToken = crypto.randomBytes(32).toString('hex');
        user.passwordResetToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');
        user.passwordResetExpires = Date.now() + 3600000; // 1 hour
        await user.save({ validateBeforeSave: false });
        return resetToken;
    }

    async verifyPasswordResetToken(token) {
        const hashedToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');
        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() }
        });
        return user ? user._id : null;
    }

    async invalidatePasswordResetToken(token) {
        const hashedToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');
        await User.findOneAndUpdate(
            { passwordResetToken: hashedToken },
            { 
                $unset: { 
                    passwordResetToken: 1, 
                    passwordResetExpires: 1 
                } 
            }
        );
    }
}

module.exports = new AuthService();

const crypto = require('crypto');
const config = require('../config/config');

const algorithm = 'aes-256-cbc';
const key = crypto.scryptSync(config.encryptionKey, 'salt', 32);
const iv = crypto.randomBytes(16);

exports.encrypt = (text) => {
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return { iv: iv.toString('hex'), encryptedData: encrypted };
};

exports.decrypt = (encryptedData, iv) => {
    const decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(iv, 'hex'));
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
};

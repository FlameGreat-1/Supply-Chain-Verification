// src/controllers/token.controller.js

const blockchainService = require('../services/blockchain.service');
const logger = require('../utils/logger');

exports.mintTokens = async (req, res, next) => {
    try {
        const { to, amount } = req.body;
        await blockchainService.mintTokens(to, amount);
        logger.info(`Tokens minted: ${amount} to ${to}`);
        res.status(200).json({ success: true, message: 'Tokens minted successfully' });
    } catch (error) {
        logger.error(`Error minting tokens: ${error.message}`);
        next(error);
    }
};

exports.getTokenBalance = async (req, res, next) => {
    try {
        const { address } = req.params;
        const balance = await blockchainService.getTokenBalance(address);
        res.status(200).json({ success: true, data: { address, balance } });
    } catch (error) {
        logger.error(`Error getting token balance: ${error.message}`);
        next(error);
    }
};

exports.transferTokens = async (req, res, next) => {
    try {
        const { from, to, amount } = req.body;
        await blockchainService.transferTokens(from, to, amount);
        logger.info(`Tokens transferred: ${amount} from ${from} to ${to}`);
        res.status(200).json({ success: true, message: 'Tokens transferred successfully' });
    } catch (error) {
        logger.error(`Error transferring tokens: ${error.message}`);
        next(error);
    }
};

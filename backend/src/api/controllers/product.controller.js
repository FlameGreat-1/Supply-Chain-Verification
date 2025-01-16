// src/api/controllers/product.controller.js

const productService = require('../services/product.service');
const blockchainService = require('../services/blockchain.service');
const zkProofService = require('../services/zkproof.service');
const logger = require('../../utils/logger');

exports.createProduct = async (req, res, next) => {
    try {
        const { name, manufacturer, manufacturingDate, batchNumber, ...additionalDetails } = req.body;
        const createdBy = req.user.id;

        const product = await productService.createProduct({
            name,
            manufacturer,
            manufacturingDate,
            batchNumber,
            createdBy,
            ...additionalDetails
        });

        // Record on Hyperledger Fabric
        await blockchainService.recordProductCreation(product);

        // Record on Ethereum
        const ethProductId = await blockchainService.createProductEth(product);
        product.ethProductId = ethProductId;
        await product.save();

        logger.info(`Product created: ${product.id} by user: ${createdBy}`);
        res.status(201).json({ success: true, data: product });
    } catch (error) {
        logger.error(`Error creating product: ${error.message}`);
        next(error);
    }
};

exports.getProduct = async (req, res, next) => {
    try {
        const { productId } = req.params;
        const product = await productService.getProductById(productId);

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        // Get data from Hyperledger Fabric
        const fabricData = await blockchainService.getProductData(productId);

        // Get data from Ethereum
        const ethData = await blockchainService.getProductEth(product.ethProductId);

        const combinedData = { 
            ...product.toObject(), 
            fabricData,
            ethData
        };

        res.status(200).json({ success: true, data: combinedData });
    } catch (error) {
        logger.error(`Error fetching product: ${error.message}`);
        next(error);
    }
};

exports.updateProduct = async (req, res, next) => {
    try {
        const { productId } = req.params;
        const updateData = req.body;
        const updatedBy = req.user.id;

        const updatedProduct = await productService.updateProduct(productId, updateData, updatedBy);

        if (!updatedProduct) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        // Update on Hyperledger Fabric
        await blockchainService.recordProductUpdate(productId, updateData, updatedBy);

        // Update on Ethereum
        await blockchainService.updateProductEth(updatedProduct.ethProductId, updateData);

        logger.info(`Product updated: ${productId} by user: ${updatedBy}`);
        res.status(200).json({ success: true, data: updatedProduct });
    } catch (error) {
        logger.error(`Error updating product: ${error.message}`);
        next(error);
    }
};

exports.transferProduct = async (req, res, next) => {
    try {
        const { productId } = req.params;
        const { newOwner, location } = req.body;
        const transferredBy = req.user.id;

        const transferResult = await productService.transferProduct(productId, newOwner, location, transferredBy);

        if (!transferResult) {
            return res.status(404).json({ success: false, message: 'Product not found or transfer not allowed' });
        }

        // Record transfer on Hyperledger Fabric
        await blockchainService.recordProductTransfer(productId, newOwner, location, transferredBy);

        // Record transfer on Ethereum
        await blockchainService.transferProductEth(transferResult.product.ethProductId, newOwner, location);

        logger.info(`Product transferred: ${productId} to ${newOwner} by user: ${transferredBy}`);
        res.status(200).json({ success: true, data: transferResult });
    } catch (error) {
        logger.error(`Error transferring product: ${error.message}`);
        next(error);
    }
};

exports.verifyProduct = async (req, res, next) => {
    try {
        const { productId } = req.params;
        const { verificationCode, manufacturerSecret, timestamp } = req.body;

        // Verify on Hyperledger Fabric
        const fabricVerificationResult = await blockchainService.verifyProduct(productId, verificationCode);

        // Verify on Ethereum
        const product = await productService.getProductById(productId);
        const ethVerificationResult = await blockchainService.verifyProductEth(product.ethProductId, verificationCode);

        // Generate and verify zk-SNARK proof
        const { proof, publicSignals } = await zkProofService.generateProof(productId, manufacturerSecret, timestamp);
        const zkVerificationResult = await zkProofService.verifyProof(proof, publicSignals);

        const isAuthentic = fabricVerificationResult.isAuthentic && ethVerificationResult.isAuthentic && zkVerificationResult;

        if (!isAuthentic) {
            logger.warn(`Failed product verification attempt: ${productId}`);
            return res.status(400).json({ 
                success: false, 
                message: 'Product verification failed', 
                data: { 
                    fabricVerificationResult, 
                    ethVerificationResult,
                    zkVerificationResult 
                } 
            });
        }

        // If verification is successful, reward the user
        await blockchainService.reportActivity(req.user.address);

        logger.info(`Product verified: ${productId}`);
        res.status(200).json({ 
            success: true, 
            data: { 
                fabricVerificationResult, 
                ethVerificationResult,
                zkVerificationResult 
            } 
        });
    } catch (error) {
        logger.error(`Error verifying product: ${error.message}`);
        next(error);
    }
};


exports.verifyProduct = async (req, res, next) => {
    try {
        const { productId } = req.params;
        const { verificationCode, manufacturerSecret, timestamp } = req.body;

        // Verify on Hyperledger Fabric
        const fabricVerificationResult = await blockchainService.verifyProduct(productId, verificationCode);

        // Verify on Ethereum
        const product = await productService.getProductById(productId);
        const ethVerificationResult = await blockchainService.verifyProductEth(product.ethProductId, verificationCode);

        // Generate and verify zk-SNARK proof
        const { proof, publicSignals } = await zkProofService.generateProof(productId, manufacturerSecret, timestamp);
        const zkVerificationResult = await zkProofService.verifyProof(proof, publicSignals);

        const isAuthentic = fabricVerificationResult.isAuthentic && ethVerificationResult.isAuthentic && zkVerificationResult;

        if (!isAuthentic) {
            logger.warn(`Failed product verification attempt: ${productId}`);
            return res.status(400).json({ 
                success: false, 
                message: 'Product verification failed', 
                data: { 
                    fabricVerificationResult, 
                    ethVerificationResult,
                    zkVerificationResult 
                } 
            });
        }

        // If verification is successful, reward the user
        await blockchainService.reportActivity(req.user.address);

        logger.info(`Product verified: ${productId}`);
        res.status(200).json({ 
            success: true, 
            data: { 
                fabricVerificationResult, 
                ethVerificationResult,
                zkVerificationResult 
            } 
        });
    } catch (error) {
        logger.error(`Error verifying product: ${error.message}`);
        next(error);
    }
};


exports.getProductHistory = async (req, res, next) => {
    try {
        const { productId } = req.params;

        // Get history from Hyperledger Fabric
        const fabricHistory = await blockchainService.getProductHistory(productId);

        // Get history from Ethereum
        const product = await productService.getProductById(productId);
        const ethHistory = await blockchainService.getProductHistoryEth(product.ethProductId);

        if (!fabricHistory && !ethHistory) {
            return res.status(404).json({ success: false, message: 'Product history not found' });
        }

        res.status(200).json({ success: true, data: { fabricHistory, ethHistory } });
    } catch (error) {
        logger.error(`Error fetching product history: ${error.message}`);
        next(error);
    }
};

exports.addCertification = async (req, res, next) => {
    try {
        const { productId } = req.params;
        const { certificationBody, certificationDate, expirationDate, certificationDetails } = req.body;
        const addedBy = req.user.id;

        const certification = await productService.addCertification(productId, {
            certificationBody,
            certificationDate,
            expirationDate,
            certificationDetails,
            addedBy
        });

        // Record on Hyperledger Fabric
        await blockchainService.recordCertification(productId, certification);

        // Record on Ethereum
        const product = await productService.getProductById(productId);
        await blockchainService.recordCertificationEth(product.ethProductId, certification);

        logger.info(`Certification added to product: ${productId} by user: ${addedBy}`);
        res.status(201).json({ success: true, data: certification });
    } catch (error) {
        logger.error(`Error adding certification: ${error.message}`);
        next(error);
    }
};

exports.verifyCertification = async (req, res, next) => {
    try {
        const { productId, certificationId } = req.params;

        // Verify on Hyperledger Fabric
        const fabricVerificationResult = await blockchainService.verifyCertification(productId, certificationId);

        // Verify on Ethereum
        const product = await productService.getProductById(productId);
        const ethVerificationResult = await blockchainService.verifyCertificationEth(product.ethProductId, certificationId);

        res.status(200).json({ success: true, data: { fabricVerificationResult, ethVerificationResult } });
    } catch (error) {
        logger.error(`Error verifying certification: ${error.message}`);
        next(error);
    }
};

exports.addEthicalScore = async (req, res, next) => {
    try {
        const { productId } = req.params;
        const { scoreCategory, score, assessmentDate } = req.body;
        const assessor = req.user.id;

        const ethicalScore = await productService.addEthicalScore(productId, {
            scoreCategory,
            score,
            assessmentDate,
            assessor
        });

        // Record on Hyperledger Fabric
        await blockchainService.recordEthicalScore(productId, ethicalScore);

        // Record on Ethereum
        const product = await productService.getProductById(productId);
        await blockchainService.createEthicalAssessmentEth(product.ethProductId, scoreCategory, score, assessmentDate);

        logger.info(`Ethical score added to product: ${productId} by user: ${assessor}`);
        res.status(201).json({ success: true, data: ethicalScore });
    } catch (error) {
        logger.error(`Error adding ethical score: ${error.message}`);
        next(error);
    }
};

exports.getEthicalProfile = async (req, res, next) => {
    try {
        const { productId } = req.params;

        // Get ethical profile from Hyperledger Fabric
        const fabricEthicalProfile = await blockchainService.getEthicalProfile(productId);

        // Get ethical profile from Ethereum
        const product = await productService.getProductById(productId);
        const ethEthicalProfile = await blockchainService.getEthicalProfileEth(product.ethProductId);

        if (!fabricEthicalProfile && !ethEthicalProfile) {
            return res.status(404).json({ success: false, message: 'Ethical profile not found' });
        }

        res.status(200).json({ success: true, data: { fabricEthicalProfile, ethEthicalProfile } });
    } catch (error) {
        logger.error(`Error fetching ethical profile: ${error.message}`);
        next(error);
    }
};

exports.searchProducts = async (req, res, next) => {
    try {
        const { query, page, limit, sortBy, sortOrder } = req.query;

        const searchResults = await productService.searchProducts(query, page, limit, sortBy, sortOrder);

        res.status(200).json({ success: true, data: searchResults });
    } catch (error) {
        logger.error(`Error searching products: ${error.message}`);
        next(error);
    }
};

exports.getProductStatistics = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;

        const statistics = await productService.getProductStatistics(startDate, endDate);

        res.status(200).json({ success: true, data: statistics });
    } catch (error) {
        logger.error(`Error fetching product statistics: ${error.message}`);
        next(error);
    }
};

module.exports = exports;

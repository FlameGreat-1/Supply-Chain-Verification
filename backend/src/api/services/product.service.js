const Product = require('../models/product.model');
const blockchainService = require('./blockchain.service');
const logger = require('../../utils/logger');
const { ValidationError } = require('../../utils/errors');

class ProductService {
    async createProduct(productData) {
        try {
            const product = new Product(productData);
            await product.save();
            await blockchainService.recordProductCreation(product);
            return product;
        } catch (error) {
            logger.error(`Error creating product: ${error.message}`);
            throw new ValidationError('Failed to create product');
        }
    }

    async getProductById(productId) {
        try {
            const product = await Product.findById(productId);
            if (!product) {
                throw new ValidationError('Product not found');
            }
            return product;
        } catch (error) {
            logger.error(`Error fetching product: ${error.message}`);
            throw new ValidationError('Failed to fetch product');
        }
    }

    async updateProduct(productId, updateData, updatedBy) {
        try {
            const product = await Product.findByIdAndUpdate(productId, updateData, { new: true, runValidators: true });
            if (!product) {
                throw new ValidationError('Product not found');
            }
            await blockchainService.recordProductUpdate(productId, updateData, updatedBy);
            return product;
        } catch (error) {
            logger.error(`Error updating product: ${error.message}`);
            throw new ValidationError('Failed to update product');
        }
    }

    async transferProduct(productId, newOwner, location, transferredBy) {
        try {
            const product = await Product.findById(productId);
            if (!product) {
                throw new ValidationError('Product not found');
            }
            product.currentOwner = newOwner;
            product.location = location;
            await product.save();
            await blockchainService.recordProductTransfer(productId, newOwner, location, transferredBy);
            return product;
        } catch (error) {
            logger.error(`Error transferring product: ${error.message}`);
            throw new ValidationError('Failed to transfer product');
        }
    }

    async addCertification(productId, certificationData) {
        try {
            const product = await Product.findById(productId);
            if (!product) {
                throw new ValidationError('Product not found');
            }
            product.certifications.push(certificationData);
            await product.save();
            await blockchainService.recordCertification(productId, certificationData);
            return certificationData;
        } catch (error) {
            logger.error(`Error adding certification: ${error.message}`);
            throw new ValidationError('Failed to add certification');
        }
    }

    async addEthicalScore(productId, scoreData) {
        try {
            const product = await Product.findById(productId);
            if (!product) {
                throw new ValidationError('Product not found');
            }
            product.ethicalScores.push(scoreData);
            product.overallEthicalScore = this.calculateOverallEthicalScore(product.ethicalScores);
            await product.save();
            await blockchainService.recordEthicalScore(productId, scoreData);
            return scoreData;
        } catch (error) {
            logger.error(`Error adding ethical score: ${error.message}`);
            throw new ValidationError('Failed to add ethical score');
        }
    }

    calculateOverallEthicalScore(scores) {
        const totalScore = scores.reduce((sum, score) => sum + score.score, 0);
        return totalScore / scores.length;
    }

    async searchProducts(query, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc') {
        try {
            const options = {
                page: parseInt(page),
                limit: parseInt(limit),
                sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 }
            };

            const searchQuery = {
                $or: [
                    { name: { $regex: query, $options: 'i' } },
                    { manufacturer: { $regex: query, $options: 'i' } },
                    { batchNumber: { $regex: query, $options: 'i' } }
                ]
            };

            const products = await Product.paginate(searchQuery, options);
            return products;
        } catch (error) {
            logger.error(`Error searching products: ${error.message}`);
            throw new ValidationError('Failed to search products');
        }
    }

    async getProductStatistics(startDate, endDate) {
        try {
            const stats = await Product.aggregate([
                {
                    $match: {
                        createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalProducts: { $sum: 1 },
                        averageEthicalScore: { $avg: '$overallEthicalScore' },
                        productsByManufacturer: { $push: '$manufacturer' }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        totalProducts: 1,
                        averageEthicalScore: 1,
                        topManufacturers: { $slice: ['$productsByManufacturer', 5] }
                    }
                }
            ]);

    async syncWithERP(productId, erpSystem) {
        const blockchainData = await blockchainService.getProductData(productId);
        const erpData = await ERPAdapterService.getProductData(erpSystem, productId);

        // Merge blockchain data with ERP data
        const mergedData = { ...erpData, ...blockchainData };

        // Update ERP system with blockchain data
        await ERPAdapterService.updateProductData(erpSystem, productId, mergedData);

        // Update blockchain with any new ERP data
        await blockchainService.updateProductData(productId, mergedData);

        return mergedData;
    }
}

            return stats[0] || { totalProducts: 0, averageEthicalScore: 0, topManufacturers: [] };
        } catch (error) {
            logger.error(`Error getting product statistics: ${error.message}`);
            throw new ValidationError('Failed to get product statistics');
        }
    }
}

module.exports = new ProductService();

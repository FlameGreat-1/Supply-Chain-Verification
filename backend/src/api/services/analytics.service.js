const Product = require('../models/product.model');
const User = require('../models/user.model');
const logger = require('../../utils/logger');
const { ValidationError } = require('../../utils/errors');

class AnalyticsService {
    async getSupplyChainOverview() {
        try {
            const totalProducts = await Product.countDocuments();
            const totalUsers = await User.countDocuments();
            const productsByStatus = await Product.aggregate([
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]);
            const averageEthicalScore = await Product.aggregate([
                { $group: { _id: null, avgScore: { $avg: '$overallEthicalScore' } } }
            ]);

            return {
                totalProducts,
                totalUsers,
                productsByStatus,
                averageEthicalScore: averageEthicalScore[0]?.avgScore || 0
            };
        } catch (error) {
            logger.error(`Error getting supply chain overview: ${error.message}`);
            throw new ValidationError('Failed to get supply chain overview');
        }
    }

    async getTraceabilityMetrics(startDate, endDate) {
        try {
            const transfers = await Product.aggregate([
                {
                    $match: {
                        'trackingHistory.timestamp': { $gte: new Date(startDate), $lte: new Date(endDate) }
                    }
                },
                { $unwind: '$trackingHistory' },
                {
                    $group: {
                        _id: null,
                        totalTransfers: { $sum: 1 },
                        averageTransfersPerProduct: { $avg: { $size: '$trackingHistory' } }
                    }
                }
            ]);

            return transfers[0] || { totalTransfers: 0, averageTransfersPerProduct: 0 };
        } catch (error) {
            logger.error(`Error getting traceability metrics: ${error.message}`);
            throw new ValidationError('Failed to get traceability metrics');
        }
    }

    async getEthicalSourcingMetrics(startDate, endDate) {
        try {
            const ethicalScores = await Product.aggregate([
                {
                    $match: {
                        'ethicalScores.assessmentDate': { $gte: new Date(startDate), $lte: new Date(endDate) }
                    }
                },
                {
                    $group: {
                        _id: null,
                        averageScore: { $avg: '$overallEthicalScore' },
                        highestScore: { $max: '$overallEthicalScore' },
                        lowestScore: { $min: '$overallEthicalScore' }
                    }
                }
            ]);

            return ethicalScores[0] || { averageScore: 0, highestScore: 0, lowestScore: 0 };
        } catch (error) {
            logger.error(`Error getting ethical sourcing metrics: ${error.message}`);
            throw new ValidationError('Failed to get ethical sourcing metrics');
        }
    }

    async getCertificationStatistics(startDate, endDate) {
        try {
            const certStats = await Product.aggregate([
                {
                    $match: {
                        'certifications.certificationDate': { $gte: new Date(startDate), $lte: new Date(endDate) }
                    }
                },
                { $unwind: '$certifications' },
                {
                    $group: {
                        _id: '$certifications.certificationBody',
                        count: { $sum: 1 }
                    }
                },
                { $sort: { count: -1 } }
            ]);

            return certStats;
        } catch (error) {
            logger.error(`Error getting certification statistics: ${error.message}`);
            throw new ValidationError('Failed to get certification statistics');
        }
    }

    async getUserActivityMetrics(startDate, endDate) {
        try {
            const userActivity = await User.aggregate([
                {
                    $match: {
                        lastLogin: { $gte: new Date(startDate), $lte: new Date(endDate) }
                    }
                },
                {
                    $group: {
                        _id: '$role',
                        activeUsers: { $sum: 1 }
                    }
                }
            ]);

            return userActivity;
        } catch (error) {
            logger.error(`Error getting user activity metrics: ${error.message}`);
            throw new ValidationError('Failed to get user activity metrics');
        }
    }

    async getProductTransferPatterns(startDate, endDate) {
        try {
            const transferPatterns = await Product.aggregate([
                {
                    $match: {
                        'trackingHistory.timestamp': { $gte: new Date(startDate), $lte: new Date(endDate) }
                    }
                },
                { $unwind: '$trackingHistory' },
                {
                    $group: {
                        _id: {
                            from: '$trackingHistory.location',
                            to: { $arrayElemAt: ['$trackingHistory.location', 1] }
                        },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { count: -1 } },
                { $limit: 10 }
            ]);

            return transferPatterns;
        } catch (error) {
            logger.error(`Error getting product transfer patterns: ${error.message}`);
            throw new ValidationError('Failed to get product transfer patterns');
        }
    }

    async getFraudDetectionMetrics(startDate, endDate) {
        // Implement fraud detection logic here
        // This is a placeholder and should be replaced with actual fraud detection algorithms
        return { fraudulentActivities: 0, suspiciousTransfers: 0 };
    }
    
    async processIoTData(iotData) {
    try {
        // Update real-time analytics
        await this.updateRealTimeAnalytics(iotData);
        
        // Update historical analytics
        await this.updateHistoricalAnalytics(iotData);
        
        logger.info(`Processed IoT data for device: ${iotData.device_id}`);
    } catch (error) {
        logger.error(`Error processing IoT data: ${error.message}`);
        throw new Error('Failed to process IoT data');
    }
}

async detectAnomalies(iotData) {
    try {
        const anomalies = [];
        
        // Check temperature anomalies
        if (iotData.temperature < -10 || iotData.temperature > 50) {
            anomalies.push({ type: 'temperature', value: iotData.temperature });
        }
        
        // Check humidity anomalies
        if (iotData.humidity < 0 || iotData.humidity > 100) {
            anomalies.push({ type: 'humidity', value: iotData.humidity });
        }
        
        // Check weight anomalies (assuming normal weight is between 0 and 1000 kg)
        if (iotData.weight < 0 || iotData.weight > 1000) {
            anomalies.push({ type: 'weight', value: iotData.weight });
        }
        
        return anomalies;
    } catch (error) {
        logger.error(`Error detecting anomalies: ${error.message}`);
        throw new Error('Failed to detect anomalies');
    }
}

async updateRealTimeAnalytics(iotData) {
    // Implement real-time analytics update logic
    // This could involve updating in-memory data structures or a real-time database
}

async updateHistoricalAnalytics(iotData) {
    // Implement historical analytics update logic
    // This could involve aggregating data and storing it in the database
}


    async getSustainabilityMetrics(startDate, endDate) {
        try {
            const sustainabilityMetrics = await Product.aggregate([
                {
                    $match: {
                        'ethicalScores.assessmentDate': { $gte: new Date(startDate), $lte: new Date(endDate) }
                    }
                },
                { $unwind: '$ethicalScores' },
                {
                    $group: {
                        _id: '$ethicalScores.scoreCategory',
                        averageScore: { $avg: '$ethicalScores.score' }
                    }
                }
            ]);

            return sustainabilityMetrics;
        } catch (error) {
            logger.error(`Error getting sustainability metrics: ${error.message}`);
            throw new ValidationError('Failed to get sustainability metrics');
        }
    }

    async generateCustomReport(startDate, endDate, metrics) {
        // Implement custom report generation logic here
        // This should be flexible enough to generate reports based on the requested metrics
        const report = {};
        for (const metric of metrics) {
            switch (metric) {
                case 'traceability':
                    report.traceability = await this.getTraceabilityMetrics(startDate, endDate);
                    break;
                case 'ethicalSourcing':
                    report.ethicalSourcing = await this.getEthicalSourcingMetrics(startDate, endDate);
                    break;
                // Add cases for other metrics as needed
            }
        }
        return report;
    }
}

module.exports = new AnalyticsService();

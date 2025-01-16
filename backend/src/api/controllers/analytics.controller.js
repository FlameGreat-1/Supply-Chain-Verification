const analyticsService = require('../services/analytics.service');
const logger = require('../../utils/logger');

exports.getSupplyChainOverview = async (req, res, next) => {
    try {
        const overview = await analyticsService.getSupplyChainOverview();
        res.status(200).json({ success: true, data: overview });
    } catch (error) {
        logger.error(`Error fetching supply chain overview: ${error.message}`);
        next(error);
    }
};

exports.getTraceabilityMetrics = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        const metrics = await analyticsService.getTraceabilityMetrics(startDate, endDate);
        res.status(200).json({ success: true, data: metrics });
    } catch (error) {
        logger.error(`Error fetching traceability metrics: ${error.message}`);
        next(error);
    }
};

exports.getEthicalSourcingMetrics = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        const metrics = await analyticsService.getEthicalSourcingMetrics(startDate, endDate);
        res.status(200).json({ success: true, data: metrics });
    } catch (error) {
        logger.error(`Error fetching ethical sourcing metrics: ${error.message}`);
        next(error);
    }
};

exports.getCertificationStatistics = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        const statistics = await analyticsService.getCertificationStatistics(startDate, endDate);
        res.status(200).json({ success: true, data: statistics });
    } catch (error) {
        logger.error(`Error fetching certification statistics: ${error.message}`);
        next(error);
    }
};

exports.getUserActivityMetrics = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        const metrics = await analyticsService.getUserActivityMetrics(startDate, endDate);
        res.status(200).json({ success: true, data: metrics });
    } catch (error) {
        logger.error(`Error fetching user activity metrics: ${error.message}`);
        next(error);
    }
};

exports.getProductTransferPatterns = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        const patterns = await analyticsService.getProductTransferPatterns(startDate, endDate);
        res.status(200).json({ success: true, data: patterns });
    } catch (error) {
        logger.error(`Error fetching product transfer patterns: ${error.message}`);
        next(error);
    }
};

exports.getFraudDetectionMetrics = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        const metrics = await analyticsService.getFraudDetectionMetrics(startDate, endDate);
        res.status(200).json({ success: true, data: metrics });
    } catch (error) {
        logger.error(`Error fetching fraud detection metrics: ${error.message}`);
        next(error);
    }
};

exports.getSustainabilityMetrics = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        const metrics = await analyticsService.getSustainabilityMetrics(startDate, endDate);
        res.status(200).json({ success: true, data: metrics });
    } catch (error) {
        logger.error(`Error fetching sustainability metrics: ${error.message}`);
        next(error);
    }
};

exports.generateCustomReport = async (req, res, next) => {
    try {
        const { startDate, endDate, metrics } = req.body;
        const report = await analyticsService.generateCustomReport(startDate, endDate, metrics);
        res.status(200).json({ success: true, data: report });
    } catch (error) {
        logger.error(`Error generating custom report: ${error.message}`);
        next(error);
    }
};

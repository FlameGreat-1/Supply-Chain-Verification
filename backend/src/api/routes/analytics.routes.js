// src/api/routes/analytics.routes.js

const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const validationMiddleware = require('../middlewares/validation.middleware');

// Get supply chain overview
router.get(
  '/overview',
  authMiddleware.authenticate,
  authMiddleware.authorize(['admin', 'analyst']),
  analyticsController.getSupplyChainOverview
);

// Get product traceability metrics
router.get(
  '/traceability',
  authMiddleware.authenticate,
  authMiddleware.authorize(['admin', 'analyst']),
  validationMiddleware.validateDateRange,
  analyticsController.getTraceabilityMetrics
);

// Get ethical sourcing metrics
router.get(
  '/ethical-sourcing',
  authMiddleware.authenticate,
  authMiddleware.authorize(['admin', 'analyst']),
  validationMiddleware.validateDateRange,
  analyticsController.getEthicalSourcingMetrics
);

// Get certification statistics
router.get(
  '/certifications',
  authMiddleware.authenticate,
  authMiddleware.authorize(['admin', 'analyst']),
  validationMiddleware.validateDateRange,
  analyticsController.getCertificationStatistics
);

// Get user activity metrics
router.get(
  '/user-activity',
  authMiddleware.authenticate,
  authMiddleware.authorize(['admin']),
  validationMiddleware.validateDateRange,
  analyticsController.getUserActivityMetrics
);

// Get product transfer patterns
router.get(
  '/transfer-patterns',
  authMiddleware.authenticate,
  authMiddleware.authorize(['admin', 'analyst']),
  validationMiddleware.validateDateRange,
  analyticsController.getProductTransferPatterns
);

// Get fraud detection metrics
router.get(
  '/fraud-detection',
  authMiddleware.authenticate,
  authMiddleware.authorize(['admin', 'analyst']),
  validationMiddleware.validateDateRange,
  analyticsController.getFraudDetectionMetrics
);

// Get sustainability metrics
router.get(
  '/sustainability',
  authMiddleware.authenticate,
  authMiddleware.authorize(['admin', 'analyst']),
  validationMiddleware.validateDateRange,
  analyticsController.getSustainabilityMetrics
);

// Generate custom report
router.post(
  '/custom-report',
  authMiddleware.authenticate,
  authMiddleware.authorize(['admin', 'analyst']),
  validationMiddleware.validateCustomReportRequest,
  analyticsController.generateCustomReport
);

module.exports = router;

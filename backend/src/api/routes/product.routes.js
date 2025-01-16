// src/api/routes/product.routes.js

const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const validationMiddleware = require('../middlewares/validation.middleware');

// Create a new product
router.post(
  '/',
  authMiddleware.authenticate,
  authMiddleware.authorize(['manufacturer', 'admin']),
  validationMiddleware.validateProductCreation,
  productController.createProduct
);

// Get a product by ID
router.get(
  '/:productId',
  authMiddleware.authenticate,
  validationMiddleware.validateProductId,
  productController.getProduct
);

// Update a product
router.put(
  '/:productId',
  authMiddleware.authenticate,
  authMiddleware.authorize(['manufacturer', 'admin']),
  validationMiddleware.validateProductUpdate,
  productController.updateProduct
);

// Transfer product ownership
router.post(
  '/:productId/transfer',
  authMiddleware.authenticate,
  authMiddleware.authorize(['manufacturer', 'distributor', 'retailer']),
  validationMiddleware.validateProductTransfer,
  productController.transferProduct
);

// Verify product authenticity
router.post(
  '/:productId/verify',
  validationMiddleware.validateProductVerification,
  productController.verifyProduct
);

// Get product history
router.get(
  '/:productId/history',
  authMiddleware.authenticate,
  validationMiddleware.validateProductId,
  productController.getProductHistory
);

// Add certification to a product
router.post(
  '/:productId/certifications',
  authMiddleware.authenticate,
  authMiddleware.authorize(['certifier', 'admin']),
  validationMiddleware.validateCertificationAddition,
  productController.addCertification
);

// Verify product certification
router.get(
  '/:productId/certifications/:certificationId/verify',
  validationMiddleware.validateCertificationVerification,
  productController.verifyCertification
);

// Add ethical score to a product
router.post(
  '/:productId/ethical-scores',
  authMiddleware.authenticate,
  authMiddleware.authorize(['assessor', 'admin']),
  validationMiddleware.validateEthicalScoreAddition,
  productController.addEthicalScore
);

// Get product ethical profile
router.get(
  '/:productId/ethical-profile',
  authMiddleware.authenticate,
  validationMiddleware.validateProductId,
  productController.getEthicalProfile
);

// Search products
router.get(
  '/search',
  authMiddleware.authenticate,
  validationMiddleware.validateProductSearch,
  productController.searchProducts
);

// Trigger ERP  synchronization
router.post(
    '/:productId/sync-erp',
    authMiddleware.authenticate,
    authMiddleware.authorize(['admin', 'manufacturer']),
    async (req, res, next) => {
        try {
            const { productId } = req.params;
            const { erpSystem } = req.body;

            const syncedData = await productService.syncWithERP(productId, erpSystem);

            res.status(200).json({ success: true, data: syncedData });
        } catch (error) {
            next(error);
        }
    }
);


// Get product statistics
router.get(
  '/statistics',
  authMiddleware.authenticate,
  authMiddleware.authorize(['admin', 'analyst']),
  productController.getProductStatistics
);

module.exports = router;

// src/routes/token.routes.js

const express = require('express');
const router = express.Router();
const tokenController = require('../controllers/token.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const validationMiddleware = require('../middlewares/validation.middleware');

router.post(
  '/mint',
  authMiddleware.authenticate,
  authMiddleware.authorize(['admin']),
  validationMiddleware.validateTokenMint,
  tokenController.mintTokens
);

router.get(
  '/balance/:address',
  authMiddleware.authenticate,
  validationMiddleware.validateAddress,
  tokenController.getTokenBalance
);

router.post(
  '/transfer',
  authMiddleware.authenticate,
  validationMiddleware.validateTokenTransfer,
  tokenController.transferTokens
);

module.exports = router;

const express = require('express');
const {
    createOrderController,
    verifyPaymentController,
    webhookController
} = require('../controllers/payment.controller');

const router = express.Router();

router.post('/create-order', createOrderController);
router.post('/verify', verifyPaymentController);
router.post('/webhook', webhookController);

export default router;
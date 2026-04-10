const express = require('express');
const router = express.Router();
const { createPaymentIntent, confirmManualPayment, stripeWebhook, getLenderPaymentInfo, getPlatformEarnings } = require('../controllers/paymentController');
const { protect, admin } = require('../middleware/auth');

// Stripe webhook (raw body required, handled in server.js)
router.post('/webhook', stripeWebhook);

router.use(protect);
router.post('/create-intent', createPaymentIntent);
router.post('/confirm-manual', confirmManualPayment);
router.get('/lender-info/:bookingId', getLenderPaymentInfo);
router.get('/earnings', admin, getPlatformEarnings);

module.exports = router;

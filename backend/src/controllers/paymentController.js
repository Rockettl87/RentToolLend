const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Booking = require('../models/Booking');
const User = require('../models/User');

// @desc    Create Stripe payment intent for a booking
// @route   POST /api/payments/create-intent
const createPaymentIntent = async (req, res) => {
  try {
    const { bookingId } = req.body;

    const booking = await Booking.findById(bookingId)
      .populate('tool', 'title')
      .populate('lender', 'stripeConnectAccountId');

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.renter.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (booking.status !== 'approved') {
      return res.status(400).json({ success: false, message: 'Booking must be approved first' });
    }

    const amountCents = Math.round(booking.totalCharged * 100);
    const platformFeeCents = Math.round(booking.platformFee * 100);

    const paymentIntentData = {
      amount: amountCents,
      currency: 'usd',
      metadata: {
        bookingId: booking._id.toString(),
        renterId: booking.renter.toString(),
        lenderId: booking.lender._id.toString(),
        toolTitle: booking.tool.title,
        platformFee: booking.platformFee.toString(),
      },
      description: `RentToolLend: ${booking.tool.title} rental`,
    };

    // If lender has Stripe Connect, use application fee split
    if (booking.lender.stripeConnectAccountId) {
      paymentIntentData.application_fee_amount = platformFeeCents;
      paymentIntentData.transfer_data = {
        destination: booking.lender.stripeConnectAccountId,
      };
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentData);

    booking.stripePaymentIntentId = paymentIntent.id;
    await booking.save();

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
      amount: booking.totalCharged,
      breakdown: {
        rentalSubtotal: booking.rentalSubtotal,
        insuranceFee: booking.insuranceFee,
        deliveryFee: booking.deliveryFee,
        depositAmount: booking.depositAmount,
        platformFee: booking.platformFee,
        lenderPayout: booking.lenderPayout,
        total: booking.totalCharged,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Confirm payment (for non-Stripe payment methods)
// @route   POST /api/payments/confirm-manual
const confirmManualPayment = async (req, res) => {
  try {
    const { bookingId, paymentReference, paymentMethod } = req.body;

    const booking = await Booking.findById(bookingId)
      .populate('lender', 'paypalEmail venmoHandle zellePhone zelleEmail');

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.renter.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    booking.paymentStatus = 'paid';
    booking.status = 'paid';
    booking.paymentConfirmedAt = new Date();
    booking.paidAt = new Date();

    if (paymentMethod === 'paypal') booking.paypalOrderId = paymentReference;
    await booking.save();

    res.json({
      success: true,
      booking,
      message: 'Payment confirmed. The lender has been notified.',
      lenderPaymentInfo: {
        method: paymentMethod,
        paypal: booking.lender.paypalEmail,
        venmo: booking.lender.venmoHandle,
        zelle_phone: booking.lender.zellePhone,
        zelle_email: booking.lender.zelleEmail,
        amount: booking.lenderPayout,
        note: `RentToolLend rental - Booking ${booking._id}. Platform fee of $${booking.platformFee} has been deducted.`
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Stripe webhook handler
// @route   POST /api/payments/webhook
const stripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).json({ message: `Webhook Error: ${err.message}` });
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    const bookingId = paymentIntent.metadata.bookingId;

    const booking = await Booking.findById(bookingId);
    if (booking) {
      booking.status = 'paid';
      booking.paymentStatus = 'paid';
      booking.paymentConfirmedAt = new Date();
      booking.paidAt = new Date();
      await booking.save();
    }
  }

  if (event.type === 'payment_intent.payment_failed') {
    const paymentIntent = event.data.object;
    const bookingId = paymentIntent.metadata.bookingId;

    const booking = await Booking.findById(bookingId);
    if (booking) {
      booking.paymentStatus = 'failed';
      await booking.save();
    }
  }

  res.json({ received: true });
};

// @desc    Get payment info for peer-to-peer methods
// @route   GET /api/payments/lender-info/:bookingId
const getLenderPaymentInfo = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId)
      .populate('lender', 'firstName lastName paypalEmail venmoHandle zellePhone zelleEmail preferredPaymentMethod');

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.renter.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const lender = booking.lender;
    res.json({
      success: true,
      paymentInfo: {
        preferredMethod: lender.preferredPaymentMethod,
        paypal: lender.paypalEmail,
        venmo: lender.venmoHandle ? `@${lender.venmoHandle}` : null,
        zelle: lender.zellePhone || lender.zelleEmail,
        amountToSend: booking.lenderPayout,
        totalCharged: booking.totalCharged,
        platformFeeNote: `A 20% platform fee ($${booking.platformFee}) is deducted. Send $${booking.lenderPayout} to the lender.`,
        reference: `RentToolLend-${booking._id.toString().slice(-8).toUpperCase()}`
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get platform earnings summary (admin)
// @route   GET /api/payments/earnings
const getPlatformEarnings = async (req, res) => {
  try {
    const result = await Booking.aggregate([
      { $match: { paymentStatus: 'paid' } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalCharged' },
          totalPlatformFees: { $sum: '$platformFee' },
          totalLenderPayouts: { $sum: '$lenderPayout' },
          totalInsuranceFees: { $sum: '$insuranceFee' },
          bookingCount: { $sum: 1 }
        }
      }
    ]);

    res.json({ success: true, earnings: result[0] || {} });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createPaymentIntent, confirmManualPayment, stripeWebhook, getLenderPaymentInfo, getPlatformEarnings };

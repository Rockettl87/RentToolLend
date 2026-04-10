const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  tool: { type: mongoose.Schema.Types.ObjectId, ref: 'Tool', required: true },
  renter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  lender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  totalDays: { type: Number, required: true },

  // Pricing breakdown
  rentalRate: { type: Number, required: true }, // Price per day used
  rentalSubtotal: { type: Number, required: true }, // rentalRate * totalDays
  depositAmount: { type: Number, default: 0 },
  deliveryFee: { type: Number, default: 0 },
  insuranceFee: { type: Number, required: true }, // 10% of rentalSubtotal
  platformFee: { type: Number, required: true }, // 20% of rentalSubtotal (Brad's cut)
  lenderPayout: { type: Number, required: true }, // 80% of rentalSubtotal
  totalCharged: { type: Number, required: true }, // rentalSubtotal + insuranceFee + deliveryFee + deposit

  // Payment
  paymentMethod: {
    type: String,
    enum: ['stripe', 'paypal', 'venmo', 'zelle'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded', 'partially_refunded', 'failed'],
    default: 'pending'
  },
  stripePaymentIntentId: String,
  stripeTransferId: String,
  paypalOrderId: String,
  paymentConfirmedAt: Date,

  // Delivery
  deliveryOption: {
    type: String,
    enum: ['pickup', 'delivery'],
    default: 'pickup'
  },
  deliveryAddress: {
    address: String,
    city: String,
    state: String,
    zip: String
  },

  // Booking Status
  status: {
    type: String,
    enum: [
      'pending',      // Awaiting lender approval
      'approved',     // Lender approved, awaiting payment
      'paid',         // Payment received, confirmed
      'active',       // Tool is currently rented out
      'completed',    // Rental period ended
      'cancelled',    // Cancelled by renter or lender
      'disputed'      // Under dispute/claim
    ],
    default: 'pending'
  },

  // Insurance
  insurancePlan: {
    type: String,
    enum: ['basic', 'standard', 'premium'],
    default: 'standard'
  },
  insuranceCoverageAmount: { type: Number, default: 1000 },

  // Messages / Notes
  renterMessage: String,
  lenderNote: String,
  cancellationReason: String,
  cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  cancelledAt: Date,

  // Reviews
  renterReviewed: { type: Boolean, default: false },
  lenderReviewed: { type: Boolean, default: false },

  // Claim
  hasClaim: { type: Boolean, default: false },
  claimId: { type: mongoose.Schema.Types.ObjectId, ref: 'Claim' },

  // Timestamps for status changes
  approvedAt: Date,
  paidAt: Date,
  activatedAt: Date,
  completedAt: Date,
}, {
  timestamps: true
});

bookingSchema.virtual('duration').get(function () {
  return Math.ceil((this.endDate - this.startDate) / (1000 * 60 * 60 * 24));
});

module.exports = mongoose.model('Booking', bookingSchema);

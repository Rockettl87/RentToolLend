const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reviewee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tool: { type: mongoose.Schema.Types.ObjectId, ref: 'Tool' },

  // Review type determines context
  reviewType: {
    type: String,
    enum: ['renter_reviewing_lender', 'lender_reviewing_renter'],
    required: true
  },

  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true, maxlength: 1000 },

  // Specific rating categories
  categories: {
    communication: { type: Number, min: 1, max: 5 },
    accuracy: { type: Number, min: 1, max: 5 }, // Tool as described
    condition: { type: Number, min: 1, max: 5 }, // Tool condition
    value: { type: Number, min: 1, max: 5 },     // Value for money
    reliability: { type: Number, min: 1, max: 5 } // Showed up on time, etc.
  },

  isPublic: { type: Boolean, default: true },
  ownerResponse: String,
  ownerResponseAt: Date,
}, {
  timestamps: true
});

// Prevent duplicate reviews per booking per reviewer
reviewSchema.index({ booking: 1, reviewer: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);

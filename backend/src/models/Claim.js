const mongoose = require('mongoose');

const claimSchema = new mongoose.Schema({
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reportedAgainst: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tool: { type: mongoose.Schema.Types.ObjectId, ref: 'Tool', required: true },

  claimType: {
    type: String,
    enum: ['damage', 'theft', 'non_return', 'injury', 'dispute', 'other'],
    required: true
  },

  description: { type: String, required: true, maxlength: 3000 },
  estimatedDamageAmount: { type: Number },
  images: [String], // Evidence photos

  status: {
    type: String,
    enum: ['submitted', 'under_review', 'approved', 'denied', 'resolved', 'escalated'],
    default: 'submitted'
  },

  // Insurance coverage details
  coverageApplied: { type: Boolean, default: false },
  approvedAmount: { type: Number, default: 0 },
  denialReason: String,

  // Admin notes
  adminNotes: String,
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolvedAt: Date,

  // Both parties' statements
  reporterStatement: String,
  respondentStatement: String,
  respondentRespondedAt: Date,
}, {
  timestamps: true
});

module.exports = mongoose.model('Claim', claimSchema);

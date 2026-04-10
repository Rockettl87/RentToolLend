const mongoose = require('mongoose');

const toolSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, required: true, maxlength: 2000 },
  category: {
    type: String,
    required: true,
    enum: [
      'Power Tools', 'Hand Tools', 'Garden & Outdoor', 'Construction',
      'Plumbing', 'Electrical', 'Automotive', 'Cleaning', 'Painting',
      'Measuring & Layout', 'Ladders & Scaffolding', 'Welding',
      'Air Tools & Compressors', 'Concrete & Masonry', 'Other'
    ]
  },
  subcategory: String,
  brand: String,
  model: String,
  condition: {
    type: String,
    enum: ['Like New', 'Excellent', 'Good', 'Fair'],
    required: true
  },
  images: [{ type: String }], // URLs to uploaded images

  // Pricing
  pricePerDay: { type: Number, required: true, min: 1 },
  pricePerWeek: { type: Number }, // Optional weekly rate
  pricePerMonth: { type: Number }, // Optional monthly rate
  depositAmount: { type: Number, default: 0 }, // Security deposit

  // Minimum rental duration (days)
  minRentalDays: { type: Number, default: 1 },
  maxRentalDays: { type: Number, default: 30 },

  // Location
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }, // [lng, lat]
    address: String,
    city: { type: String, required: true },
    state: String,
    zip: String,
    country: { type: String, default: 'US' }
  },

  // Availability
  isAvailable: { type: Boolean, default: true },
  unavailableDates: [{ // Blocked date ranges
    startDate: Date,
    endDate: Date,
    reason: String
  }],

  // Delivery
  deliveryOptions: {
    pickup: { type: Boolean, default: true },
    delivery: { type: Boolean, default: false },
    deliveryRadiusMiles: { type: Number, default: 10 },
    deliveryFeePerMile: { type: Number, default: 0.50 },
    deliveryFlatRate: { type: Number, default: 0 }
  },

  // Requirements
  requiresId: { type: Boolean, default: false },
  requiresDeposit: { type: Boolean, default: false },
  specialInstructions: String,
  safetyNotes: String,

  // Stats
  viewCount: { type: Number, default: 0 },
  favoriteCount: { type: Number, default: 0 },
  totalRentals: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },

  tags: [String],
  isActive: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
}, {
  timestamps: true
});

toolSchema.index({ location: '2dsphere' });
toolSchema.index({ category: 1, isAvailable: 1, isActive: 1 });
toolSchema.index({ title: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Tool', toolSchema);

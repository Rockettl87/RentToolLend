const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6, select: false },
  avatar: { type: String, default: null },
  phone: { type: String, trim: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isVerified: { type: Boolean, default: false },
  verificationToken: String,

  // Location
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
    address: String,
    city: String,
    state: String,
    zip: String,
    country: { type: String, default: 'US' }
  },

  // Payment methods
  stripeCustomerId: String,
  stripeConnectAccountId: String, // For receiving payouts as lender
  paypalEmail: String,
  venmoHandle: String,
  zellePhone: String,
  zelleEmail: String,

  // Preferences
  preferredPaymentMethod: {
    type: String,
    enum: ['stripe', 'paypal', 'venmo', 'zelle'],
    default: 'stripe'
  },

  // Ratings
  lenderRating: { type: Number, default: 0 },
  lenderReviewCount: { type: Number, default: 0 },
  renterRating: { type: Number, default: 0 },
  renterReviewCount: { type: Number, default: 0 },

  // Stats
  totalEarnings: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  toolsListed: { type: Number, default: 0 },
  rentalsCompleted: { type: Number, default: 0 },

  isActive: { type: Boolean, default: true },
  lastLogin: Date,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
}, {
  timestamps: true
});

userSchema.index({ location: '2dsphere' });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

module.exports = mongoose.model('User', userSchema);

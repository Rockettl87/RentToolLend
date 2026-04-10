const Booking = require('../models/Booking');
const Tool = require('../models/Tool');
const User = require('../models/User');
const {
  sendNewBookingRequest,
  sendBookingApproved,
  sendBookingDeclined,
  sendBookingCancelled,
  sendBookingCompleted,
} = require('../services/emailService');

const PLATFORM_FEE_PERCENT = parseFloat(process.env.PLATFORM_FEE_PERCENT || 20) / 100;
const INSURANCE_FEE_PERCENT = parseFloat(process.env.INSURANCE_FEE_PERCENT || 10) / 100;

const calculateBookingCosts = (tool, startDate, endDate, deliveryOption) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

  let rentalRate = tool.pricePerDay;
  if (totalDays >= 30 && tool.pricePerMonth) {
    rentalRate = tool.pricePerMonth / 30;
  } else if (totalDays >= 7 && tool.pricePerWeek) {
    rentalRate = tool.pricePerWeek / 7;
  }

  const rentalSubtotal = rentalRate * totalDays;
  const insuranceFee = parseFloat((rentalSubtotal * INSURANCE_FEE_PERCENT).toFixed(2));
  const platformFee = parseFloat((rentalSubtotal * PLATFORM_FEE_PERCENT).toFixed(2));
  const lenderPayout = parseFloat((rentalSubtotal - platformFee).toFixed(2));

  let deliveryFee = 0;
  if (deliveryOption === 'delivery' && tool.deliveryOptions.delivery) {
    deliveryFee = tool.deliveryOptions.deliveryFlatRate || 0;
  }

  const totalCharged = parseFloat((rentalSubtotal + insuranceFee + deliveryFee + (tool.depositAmount || 0)).toFixed(2));

  return { totalDays, rentalRate, rentalSubtotal, insuranceFee, platformFee, lenderPayout, deliveryFee, totalCharged };
};

// @desc    Create booking request
// @route   POST /api/bookings
const createBooking = async (req, res) => {
  try {
    const { toolId, startDate, endDate, paymentMethod, deliveryOption, deliveryAddress, renterMessage, insurancePlan } = req.body;

    const tool = await Tool.findById(toolId).populate('owner');
    if (!tool || !tool.isActive) {
      return res.status(404).json({ success: false, message: 'Tool not found' });
    }

    if (tool.owner._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot rent your own tool' });
    }

    // Check availability
    const conflicting = await Booking.findOne({
      tool: toolId,
      status: { $in: ['approved', 'paid', 'active'] },
      $or: [{ startDate: { $lte: new Date(endDate) }, endDate: { $gte: new Date(startDate) } }]
    });

    if (conflicting) {
      return res.status(400).json({ success: false, message: 'Tool is not available for selected dates' });
    }

    const costs = calculateBookingCosts(tool, startDate, endDate, deliveryOption || 'pickup');
    const insuranceCoverage = insurancePlan === 'premium' ? 5000 : insurancePlan === 'standard' ? 1000 : 500;

    const booking = await Booking.create({
      tool: toolId,
      renter: req.user._id,
      lender: tool.owner._id,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      ...costs,
      depositAmount: tool.depositAmount || 0,
      paymentMethod,
      deliveryOption: deliveryOption || 'pickup',
      deliveryAddress: deliveryOption === 'delivery' ? deliveryAddress : undefined,
      renterMessage,
      insurancePlan: insurancePlan || 'standard',
      insuranceCoverageAmount: insuranceCoverage,
      status: 'pending'
    });

    await booking.populate([
      { path: 'tool', select: 'title images pricePerDay' },
      { path: 'renter', select: 'firstName lastName email avatar' },
      { path: 'lender', select: 'firstName lastName email avatar' }
    ]);

    sendNewBookingRequest(booking).catch(() => {});

    res.status(201).json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get booking by ID
// @route   GET /api/bookings/:id
const getBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('tool')
      .populate('renter', 'firstName lastName email avatar phone')
      .populate('lender', 'firstName lastName email avatar phone paypalEmail venmoHandle zellePhone');

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    const isInvolved = booking.renter._id.toString() === req.user._id.toString() ||
      booking.lender._id.toString() === req.user._id.toString() ||
      req.user.role === 'admin';

    if (!isInvolved) return res.status(403).json({ success: false, message: 'Access denied' });

    res.json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get my bookings (as renter)
// @route   GET /api/bookings/my-rentals
const getMyRentals = async (req, res) => {
  try {
    const bookings = await Booking.find({ renter: req.user._id })
      .populate('tool', 'title images category')
      .populate('lender', 'firstName lastName avatar lenderRating')
      .sort({ createdAt: -1 });
    res.json({ success: true, bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get my lending requests
// @route   GET /api/bookings/my-lending
const getMyLending = async (req, res) => {
  try {
    const bookings = await Booking.find({ lender: req.user._id })
      .populate('tool', 'title images category')
      .populate('renter', 'firstName lastName avatar renterRating')
      .sort({ createdAt: -1 });
    res.json({ success: true, bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Approve or decline booking (lender)
// @route   PUT /api/bookings/:id/respond
const respondToBooking = async (req, res) => {
  try {
    const { action, lenderNote } = req.body; // action: 'approve' | 'decline'
    const booking = await Booking.findById(req.params.id);

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.lender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (booking.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Booking is no longer pending' });
    }

    if (action === 'approve') {
      booking.status = 'approved';
      booking.approvedAt = new Date();
    } else {
      booking.status = 'cancelled';
      booking.cancellationReason = lenderNote || 'Declined by lender';
      booking.cancelledBy = req.user._id;
      booking.cancelledAt = new Date();
    }

    booking.lenderNote = lenderNote;
    await booking.save();

    await booking.populate([
      { path: 'tool', select: 'title' },
      { path: 'renter', select: 'firstName lastName email' },
      { path: 'lender', select: 'firstName lastName email' },
    ]);

    if (action === 'approve') {
      sendBookingApproved(booking).catch(() => {});
    } else {
      sendBookingDeclined(booking).catch(() => {});
    }

    res.json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Cancel booking (renter)
// @route   PUT /api/bookings/:id/cancel
const cancelBooking = async (req, res) => {
  try {
    const { reason } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.renter.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (['completed', 'cancelled'].includes(booking.status)) {
      return res.status(400).json({ success: false, message: 'Cannot cancel this booking' });
    }

    booking.status = 'cancelled';
    booking.cancellationReason = reason;
    booking.cancelledBy = req.user._id;
    booking.cancelledAt = new Date();
    await booking.save();

    await booking.populate([
      { path: 'tool', select: 'title' },
      { path: 'renter', select: 'firstName lastName email' },
      { path: 'lender', select: 'firstName lastName email' },
    ]);

    sendBookingCancelled(booking, true).catch(() => {});

    res.json({ success: true, booking, message: 'Booking cancelled' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark booking as active (tool picked up)
// @route   PUT /api/bookings/:id/activate
const activateBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.lender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (booking.status !== 'paid') {
      return res.status(400).json({ success: false, message: 'Booking must be paid before activation' });
    }

    booking.status = 'active';
    booking.activatedAt = new Date();
    await booking.save();

    res.json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Complete booking
// @route   PUT /api/bookings/:id/complete
const completeBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.lender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (booking.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Booking must be active to complete' });
    }

    booking.status = 'completed';
    booking.completedAt = new Date();
    await booking.save();

    await User.findByIdAndUpdate(booking.renter, { $inc: { rentalsCompleted: 1, totalSpent: booking.totalCharged } });
    await User.findByIdAndUpdate(booking.lender, { $inc: { totalEarnings: booking.lenderPayout } });
    await Tool.findByIdAndUpdate(booking.tool, { $inc: { totalRentals: 1 } });

    await booking.populate([
      { path: 'tool', select: 'title' },
      { path: 'renter', select: 'firstName lastName email' },
      { path: 'lender', select: 'firstName lastName email' },
    ]);

    sendBookingCompleted(booking).catch(() => {});

    res.json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Calculate booking cost preview
// @route   POST /api/bookings/calculate
const calculateCost = async (req, res) => {
  try {
    const { toolId, startDate, endDate, deliveryOption } = req.body;
    const tool = await Tool.findById(toolId);
    if (!tool) return res.status(404).json({ success: false, message: 'Tool not found' });

    const costs = calculateBookingCosts(tool, startDate, endDate, deliveryOption || 'pickup');
    res.json({ success: true, costs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createBooking, getBooking, getMyRentals, getMyLending,
  respondToBooking, cancelBooking, activateBooking, completeBooking, calculateCost
};

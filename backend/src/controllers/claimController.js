const Claim = require('../models/Claim');
const Booking = require('../models/Booking');

// @desc    File an insurance/damage claim
// @route   POST /api/claims
const createClaim = async (req, res) => {
  try {
    const { bookingId, claimType, description, estimatedDamageAmount, images } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    const isRenter = booking.renter.toString() === req.user._id.toString();
    const isLender = booking.lender.toString() === req.user._id.toString();

    if (!isRenter && !isLender) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (booking.hasClaim) {
      return res.status(400).json({ success: false, message: 'A claim already exists for this booking' });
    }

    const reportedAgainst = isLender ? booking.renter : booking.lender;

    const claim = await Claim.create({
      booking: bookingId,
      reporter: req.user._id,
      reportedAgainst,
      tool: booking.tool,
      claimType,
      description,
      estimatedDamageAmount,
      images: images || [],
      reporterStatement: description
    });

    booking.hasClaim = true;
    booking.claimId = claim._id;
    booking.status = 'disputed';
    await booking.save();

    res.status(201).json({
      success: true,
      claim,
      message: 'Claim submitted. Our team will review it within 2-3 business days. You are covered under the RentToolLend Insurance Protection Plan.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Respond to a claim (the person being claimed against)
// @route   PUT /api/claims/:id/respond
const respondToClaim = async (req, res) => {
  try {
    const { statement } = req.body;
    const claim = await Claim.findById(req.params.id);

    if (!claim) return res.status(404).json({ success: false, message: 'Claim not found' });
    if (claim.reportedAgainst.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    claim.respondentStatement = statement;
    claim.respondentRespondedAt = new Date();
    await claim.save();

    res.json({ success: true, claim });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get claims for current user
// @route   GET /api/claims/my-claims
const getMyClaims = async (req, res) => {
  try {
    const claims = await Claim.find({
      $or: [{ reporter: req.user._id }, { reportedAgainst: req.user._id }]
    })
      .populate('booking', 'startDate endDate totalCharged')
      .populate('tool', 'title images')
      .populate('reporter', 'firstName lastName avatar')
      .populate('reportedAgainst', 'firstName lastName avatar')
      .sort({ createdAt: -1 });

    res.json({ success: true, claims });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin: Get all claims
// @route   GET /api/claims (admin)
const getAllClaims = async (req, res) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};

    const claims = await Claim.find(query)
      .populate('booking')
      .populate('tool', 'title')
      .populate('reporter', 'firstName lastName email')
      .populate('reportedAgainst', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.json({ success: true, claims });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin: Resolve a claim
// @route   PUT /api/claims/:id/resolve (admin)
const resolveClaim = async (req, res) => {
  try {
    const { status, approvedAmount, denialReason, adminNotes } = req.body;

    const claim = await Claim.findById(req.params.id);
    if (!claim) return res.status(404).json({ success: false, message: 'Claim not found' });

    claim.status = status;
    claim.approvedAmount = approvedAmount || 0;
    claim.denialReason = denialReason;
    claim.adminNotes = adminNotes;
    claim.coverageApplied = status === 'approved';
    claim.resolvedBy = req.user._id;
    claim.resolvedAt = new Date();
    await claim.save();

    // Update booking status
    const booking = await Booking.findById(claim.booking);
    if (booking && status === 'resolved') {
      booking.status = 'completed';
      await booking.save();
    }

    res.json({ success: true, claim });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createClaim, respondToClaim, getMyClaims, getAllClaims, resolveClaim };

const Review = require('../models/Review');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Tool = require('../models/Tool');

// @desc    Submit a review
// @route   POST /api/reviews
const createReview = async (req, res) => {
  try {
    const { bookingId, rating, comment, categories, reviewType } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'Can only review completed bookings' });
    }

    const isRenter = booking.renter.toString() === req.user._id.toString();
    const isLender = booking.lender.toString() === req.user._id.toString();

    if (!isRenter && !isLender) {
      return res.status(403).json({ success: false, message: 'Not authorized to review this booking' });
    }

    // Check if already reviewed
    if (isRenter && booking.renterReviewed) {
      return res.status(400).json({ success: false, message: 'You already reviewed this booking' });
    }
    if (isLender && booking.lenderReviewed) {
      return res.status(400).json({ success: false, message: 'You already reviewed this booking' });
    }

    const actualReviewType = isRenter ? 'renter_reviewing_lender' : 'lender_reviewing_renter';
    const revieweeId = isRenter ? booking.lender : booking.renter;

    const review = await Review.create({
      booking: bookingId,
      reviewer: req.user._id,
      reviewee: revieweeId,
      tool: booking.tool,
      reviewType: actualReviewType,
      rating,
      comment,
      categories
    });

    // Update booking review flags
    if (isRenter) booking.renterReviewed = true;
    if (isLender) booking.lenderReviewed = true;
    await booking.save();

    // Recalculate reviewee's average rating
    const revieweeReviews = await Review.find({
      reviewee: revieweeId,
      reviewType: actualReviewType
    });

    const avgRating = revieweeReviews.reduce((sum, r) => sum + r.rating, 0) / revieweeReviews.length;

    if (isRenter) {
      // Renting reviewing the lender
      await User.findByIdAndUpdate(revieweeId, {
        lenderRating: parseFloat(avgRating.toFixed(2)),
        lenderReviewCount: revieweeReviews.length
      });
    } else {
      // Lender reviewing the renter
      await User.findByIdAndUpdate(revieweeId, {
        renterRating: parseFloat(avgRating.toFixed(2)),
        renterReviewCount: revieweeReviews.length
      });
    }

    // Update tool rating if renter reviewed
    if (isRenter) {
      const toolReviews = await Review.find({ tool: booking.tool, reviewType: 'renter_reviewing_lender' });
      const toolAvg = toolReviews.reduce((sum, r) => sum + r.rating, 0) / toolReviews.length;
      await Tool.findByIdAndUpdate(booking.tool, {
        rating: parseFloat(toolAvg.toFixed(2)),
        reviewCount: toolReviews.length
      });
    }

    await review.populate('reviewer', 'firstName lastName avatar');

    res.status(201).json({ success: true, review });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Review already submitted' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get reviews for a user
// @route   GET /api/reviews/user/:userId
const getUserReviews = async (req, res) => {
  try {
    const { type } = req.query; // 'lender' | 'renter'
    const query = { reviewee: req.params.userId, isPublic: true };
    if (type === 'lender') query.reviewType = 'renter_reviewing_lender';
    if (type === 'renter') query.reviewType = 'lender_reviewing_renter';

    const reviews = await Review.find(query)
      .populate('reviewer', 'firstName lastName avatar')
      .populate('tool', 'title')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ success: true, reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get reviews for a tool
// @route   GET /api/reviews/tool/:toolId
const getToolReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ tool: req.params.toolId, isPublic: true })
      .populate('reviewer', 'firstName lastName avatar')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ success: true, reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createReview, getUserReviews, getToolReviews };

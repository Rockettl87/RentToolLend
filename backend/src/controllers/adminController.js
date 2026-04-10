const User = require('../models/User');
const Tool = require('../models/Tool');
const Booking = require('../models/Booking');
const Claim = require('../models/Claim');

// @desc    Admin dashboard stats
// @route   GET /api/admin/stats
const getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers, totalTools, totalBookings, activeBookings,
      completedBookings, pendingClaims,
      revenueData
    ] = await Promise.all([
      User.countDocuments({ isActive: true }),
      Tool.countDocuments({ isActive: true }),
      Booking.countDocuments(),
      Booking.countDocuments({ status: 'active' }),
      Booking.countDocuments({ status: 'completed' }),
      Claim.countDocuments({ status: { $in: ['submitted', 'under_review'] } }),
      Booking.aggregate([
        { $match: { paymentStatus: 'paid' } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totalCharged' },
            totalPlatformFees: { $sum: '$platformFee' },
            totalLenderPayouts: { $sum: '$lenderPayout' },
            totalInsuranceFees: { $sum: '$insuranceFee' },
          }
        }
      ])
    ]);

    const revenue = revenueData[0] || { totalRevenue: 0, totalPlatformFees: 0, totalLenderPayouts: 0, totalInsuranceFees: 0 };

    // Monthly revenue breakdown (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyRevenue = await Booking.aggregate([
      { $match: { paymentStatus: 'paid', createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          revenue: { $sum: '$totalCharged' },
          platformFees: { $sum: '$platformFee' },
          bookings: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers, totalTools, totalBookings, activeBookings,
        completedBookings, pendingClaims,
        ...revenue,
        monthlyRevenue
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all users (admin)
// @route   GET /api/admin/users
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const query = {};
    if (search) query.$or = [
      { firstName: new RegExp(search, 'i') },
      { lastName: new RegExp(search, 'i') },
      { email: new RegExp(search, 'i') }
    ];

    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({ success: true, users, total });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all bookings (admin)
// @route   GET /api/admin/bookings
const getAllBookings = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = status ? { status } : {};

    const bookings = await Booking.find(query)
      .populate('tool', 'title')
      .populate('renter', 'firstName lastName email')
      .populate('lender', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    const total = await Booking.countDocuments(query);

    res.json({ success: true, bookings, total });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Deactivate user (admin)
// @route   PUT /api/admin/users/:id/deactivate
const deactivateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'User deactivated', user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Feature/unfeature a tool (admin)
// @route   PUT /api/admin/tools/:id/feature
const toggleFeatureTool = async (req, res) => {
  try {
    const tool = await Tool.findById(req.params.id);
    if (!tool) return res.status(404).json({ success: false, message: 'Tool not found' });
    tool.isFeatured = !tool.isFeatured;
    await tool.save();
    res.json({ success: true, tool });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getDashboardStats, getAllUsers, getAllBookings, deactivateUser, toggleFeatureTool };

const Tool = require('../models/Tool');
const User = require('../models/User');
const { milesToMeters } = require('../utils/haversine');

// @desc    Search tools by location and filters
// @route   GET /api/tools/search
const searchTools = async (req, res) => {
  try {
    const {
      lat, lng,
      radius = 25,       // miles
      category,
      minPrice, maxPrice,
      startDate, endDate,
      sortBy = 'distance',
      page = 1,
      limit = 20,
      q,                  // text search
      deliveryOnly,
      maxDays,
    } = req.query;

    const query = { isActive: true, isAvailable: true };

    // GPS proximity search
    if (lat && lng) {
      query.location = {
        $nearSphere: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: milesToMeters(parseFloat(radius))
        }
      };
    }

    // Category filter
    if (category && category !== 'All') query.category = category;

    // Price filter
    if (minPrice || maxPrice) {
      query.pricePerDay = {};
      if (minPrice) query.pricePerDay.$gte = parseFloat(minPrice);
      if (maxPrice) query.pricePerDay.$lte = parseFloat(maxPrice);
    }

    // Duration filter
    if (maxDays) query.maxRentalDays = { $gte: parseInt(maxDays) };

    // Delivery filter
    if (deliveryOnly === 'true') query['deliveryOptions.delivery'] = true;

    // Text search
    if (q) query.$text = { $search: q };

    // Availability - exclude tools with conflicting bookings
    if (startDate && endDate) {
      const Booking = require('../models/Booking');
      const conflictingBookings = await Booking.find({
        status: { $in: ['approved', 'paid', 'active'] },
        $or: [
          { startDate: { $lte: new Date(endDate) }, endDate: { $gte: new Date(startDate) } }
        ]
      }).distinct('tool');
      query._id = { $nin: conflictingBookings };
    }

    const sortOptions = {
      distance: {}, // Already sorted by $nearSphere
      price_low: { pricePerDay: 1 },
      price_high: { pricePerDay: -1 },
      rating: { rating: -1 },
      newest: { createdAt: -1 },
    };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    let toolsQuery = Tool.find(query)
      .populate('owner', 'firstName lastName avatar lenderRating lenderReviewCount')
      .skip(skip)
      .limit(parseInt(limit));

    if (sortBy !== 'distance') {
      toolsQuery = toolsQuery.sort(sortOptions[sortBy] || {});
    }

    const [tools, total] = await Promise.all([
      toolsQuery.exec(),
      Tool.countDocuments(query)
    ]);

    res.json({
      success: true,
      tools,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single tool
// @route   GET /api/tools/:id
const getTool = async (req, res) => {
  try {
    const tool = await Tool.findById(req.params.id)
      .populate('owner', 'firstName lastName avatar lenderRating lenderReviewCount location createdAt');

    if (!tool || !tool.isActive) {
      return res.status(404).json({ success: false, message: 'Tool not found' });
    }

    // Increment view count
    tool.viewCount += 1;
    await tool.save({ validateBeforeSave: false });

    res.json({ success: true, tool });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create tool listing
// @route   POST /api/tools
const createTool = async (req, res) => {
  try {
    const {
      title, description, category, subcategory, brand, model, condition,
      images, pricePerDay, pricePerWeek, pricePerMonth, depositAmount,
      minRentalDays, maxRentalDays, lat, lng, address, city, state, zip,
      deliveryOptions, requiresId, requiresDeposit, specialInstructions,
      safetyNotes, tags
    } = req.body;

    if (!lat || !lng) {
      return res.status(400).json({ success: false, message: 'Location coordinates are required' });
    }

    const tool = await Tool.create({
      owner: req.user._id,
      title, description, category, subcategory, brand, model, condition,
      images: images || [],
      pricePerDay, pricePerWeek, pricePerMonth,
      depositAmount: depositAmount || 0,
      minRentalDays: minRentalDays || 1,
      maxRentalDays: maxRentalDays || 30,
      location: {
        type: 'Point',
        coordinates: [parseFloat(lng), parseFloat(lat)],
        address, city, state, zip
      },
      deliveryOptions: deliveryOptions || { pickup: true, delivery: false },
      requiresId, requiresDeposit,
      specialInstructions, safetyNotes,
      tags: tags || []
    });

    await User.findByIdAndUpdate(req.user._id, { $inc: { toolsListed: 1 } });

    res.status(201).json({ success: true, tool });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update tool listing
// @route   PUT /api/tools/:id
const updateTool = async (req, res) => {
  try {
    let tool = await Tool.findById(req.params.id);

    if (!tool) return res.status(404).json({ success: false, message: 'Tool not found' });
    if (tool.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const { lat, lng, ...updateData } = req.body;
    if (lat && lng) {
      updateData.location = {
        ...tool.location,
        coordinates: [parseFloat(lng), parseFloat(lat)],
        ...req.body
      };
    }

    tool = await Tool.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });

    res.json({ success: true, tool });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete tool listing
// @route   DELETE /api/tools/:id
const deleteTool = async (req, res) => {
  try {
    const tool = await Tool.findById(req.params.id);

    if (!tool) return res.status(404).json({ success: false, message: 'Tool not found' });
    if (tool.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    tool.isActive = false;
    await tool.save();

    res.json({ success: true, message: 'Tool listing removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get my tool listings
// @route   GET /api/tools/my-listings
const getMyListings = async (req, res) => {
  try {
    const tools = await Tool.find({ owner: req.user._id, isActive: true })
      .sort({ createdAt: -1 });
    res.json({ success: true, tools });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all categories
// @route   GET /api/tools/categories
const getCategories = async (req, res) => {
  const categories = [
    'Power Tools', 'Hand Tools', 'Garden & Outdoor', 'Construction',
    'Plumbing', 'Electrical', 'Automotive', 'Cleaning', 'Painting',
    'Measuring & Layout', 'Ladders & Scaffolding', 'Welding',
    'Air Tools & Compressors', 'Concrete & Masonry', 'Other'
  ];
  res.json({ success: true, categories });
};

module.exports = { searchTools, getTool, createTool, updateTool, deleteTool, getMyListings, getCategories };

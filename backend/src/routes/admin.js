const express = require('express');
const router = express.Router();
const { getDashboardStats, getAllUsers, getAllBookings, deactivateUser, toggleFeatureTool } = require('../controllers/adminController');
const { protect, admin } = require('../middleware/auth');

router.use(protect, admin);

router.get('/stats', getDashboardStats);
router.get('/users', getAllUsers);
router.get('/bookings', getAllBookings);
router.put('/users/:id/deactivate', deactivateUser);
router.put('/tools/:id/feature', toggleFeatureTool);

module.exports = router;

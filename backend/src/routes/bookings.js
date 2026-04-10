const express = require('express');
const router = express.Router();
const {
  createBooking, getBooking, getMyRentals, getMyLending,
  respondToBooking, cancelBooking, activateBooking, completeBooking, calculateCost
} = require('../controllers/bookingController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/calculate', calculateCost);
router.post('/', createBooking);
router.get('/my-rentals', getMyRentals);
router.get('/my-lending', getMyLending);
router.get('/:id', getBooking);
router.put('/:id/respond', respondToBooking);
router.put('/:id/cancel', cancelBooking);
router.put('/:id/activate', activateBooking);
router.put('/:id/complete', completeBooking);

module.exports = router;

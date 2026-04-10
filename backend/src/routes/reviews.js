const express = require('express');
const router = express.Router();
const { createReview, getUserReviews, getToolReviews } = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');

router.post('/', protect, createReview);
router.get('/user/:userId', getUserReviews);
router.get('/tool/:toolId', getToolReviews);

module.exports = router;

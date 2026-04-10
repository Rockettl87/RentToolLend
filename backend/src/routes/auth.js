const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { register, login, getMe, updateProfile, updateLocation, getUserProfile } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', [
  body('firstName').notEmpty().trim(),
  body('lastName').notEmpty().trim(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
], register);

router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/location', protect, updateLocation);
router.get('/user/:id', getUserProfile);

module.exports = router;

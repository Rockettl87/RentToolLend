const express = require('express');
const router = express.Router();
const { createClaim, respondToClaim, getMyClaims, getAllClaims, resolveClaim } = require('../controllers/claimController');
const { protect, admin } = require('../middleware/auth');

router.use(protect);

router.post('/', createClaim);
router.get('/my-claims', getMyClaims);
router.put('/:id/respond', respondToClaim);

// Admin routes
router.get('/', admin, getAllClaims);
router.put('/:id/resolve', admin, resolveClaim);

module.exports = router;

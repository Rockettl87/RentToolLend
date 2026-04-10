const express = require('express');
const router = express.Router();
const { searchTools, getTool, createTool, updateTool, deleteTool, getMyListings, getCategories } = require('../controllers/toolController');
const { protect } = require('../middleware/auth');

router.get('/search', searchTools);
router.get('/categories', getCategories);
router.get('/my-listings', protect, getMyListings);
router.get('/:id', getTool);
router.post('/', protect, createTool);
router.put('/:id', protect, updateTool);
router.delete('/:id', protect, deleteTool);

module.exports = router;

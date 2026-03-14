const express = require('express');
const router = express.Router();
const { seedDemo, clearDemo } = require('../controllers/seedController');
const { protect } = require('../middleware/auth');

router.post('/demo', protect, seedDemo);
router.post('/clear', protect, clearDemo);

module.exports = router;

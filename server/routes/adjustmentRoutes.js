const express = require('express');
const router = express.Router();
const { getAdjustments, getAdjustmentById, createAdjustment } = require('../controllers/adjustmentController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', getAdjustments);
router.get('/:id', getAdjustmentById);
router.post('/', createAdjustment);

module.exports = router;

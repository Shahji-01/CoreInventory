const express = require('express');
const router = express.Router();
const { getStockMovements } = require('../controllers/stockMovementController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', getStockMovements);

module.exports = router;

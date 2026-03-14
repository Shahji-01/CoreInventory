const express = require('express');
const router = express.Router();
const { getDeliveries, getDeliveryById, createDelivery, updateDelivery, validateDelivery, deleteDelivery } = require('../controllers/deliveryController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', getDeliveries);
router.get('/:id', getDeliveryById);
router.post('/', createDelivery);
router.put('/:id', updateDelivery);
router.post('/:id/validate', validateDelivery);
router.post('/:id/cancel', require('../controllers/deliveryController').cancelDelivery);
router.delete('/:id', deleteDelivery);

module.exports = router;

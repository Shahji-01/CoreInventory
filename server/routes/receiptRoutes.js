const express = require('express');
const router = express.Router();
const { getReceipts, getReceiptById, createReceipt, updateReceipt, validateReceipt, deleteReceipt } = require('../controllers/receiptController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', getReceipts);
router.get('/:id', getReceiptById);
router.post('/', createReceipt);
router.put('/:id', updateReceipt);
router.post('/:id/validate', validateReceipt);
router.post('/:id/cancel', require('../controllers/receiptController').cancelReceipt);
router.delete('/:id', deleteReceipt);

module.exports = router;

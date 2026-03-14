const express = require('express');
const router = express.Router();
const { getTransfers, getTransferById, createTransfer, updateTransfer, validateTransfer, deleteTransfer } = require('../controllers/transferController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', getTransfers);
router.get('/:id', getTransferById);
router.post('/', createTransfer);
router.put('/:id', updateTransfer);
router.post('/:id/validate', validateTransfer);
router.post('/:id/cancel', require('../controllers/transferController').cancelTransfer);
router.delete('/:id', deleteTransfer);

module.exports = router;

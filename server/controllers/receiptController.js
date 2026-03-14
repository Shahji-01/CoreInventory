const ReceiptService = require('../services/receiptService');
const { success } = require('../utils/apiResponse');

// GET /api/receipts
const getReceipts = async (req, res) => {
  const result = await ReceiptService.getReceipts(req.query);
  return success(res, result);
};

// POST /api/receipts
const createReceipt = async (req, res) => {
  const result = await ReceiptService.createReceipt({ ...req.body, userId: req.user._id });
  return success(res, result, 201);
};

const getReceiptById = async (req, res) => {
  const result = await ReceiptService.getReceiptById(req.params.id);
  return success(res, result);
};

const updateReceipt = async (req, res) => {
  const result = await ReceiptService.updateReceipt(req.params.id, req.body);
  return success(res, result);
};

// POST /api/receipts/:id/validate
const validateReceipt = async (req, res) => {
  const result = await ReceiptService.validateReceipt(req.params.id, req.user._id);
  return success(res, result);
};
// POST /api/receipts/:id/cancel
const cancelReceipt = async (req, res) => {
  const result = await ReceiptService.cancelReceipt(req.params.id, req.user._id);
  return success(res, result);
};

const deleteReceipt = async (req, res) => {
  const result = await ReceiptService.deleteReceipt(req.params.id);
  return success(res, result);
};

module.exports = { getReceipts, getReceiptById, createReceipt, updateReceipt, validateReceipt, cancelReceipt, deleteReceipt };

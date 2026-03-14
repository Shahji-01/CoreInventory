const TransferService = require('../services/transferService');
const { success } = require('../utils/apiResponse');

// GET /api/transfers
const getTransfers = async (req, res) => {
  const result = await TransferService.getTransfers(req.query);
  return success(res, result);
};

// POST /api/transfers
const createTransfer = async (req, res) => {
  const result = await TransferService.createTransfer({ ...req.body, userId: req.user._id });
  return success(res, result, 201);
};

const getTransferById = async (req, res) => {
  const result = await TransferService.getTransferById(req.params.id);
  return success(res, result);
};

const updateTransfer = async (req, res) => {
  const result = await TransferService.updateTransfer(req.params.id, req.body);
  return success(res, result);
};

// POST /api/transfers/:id/validate
const validateTransfer = async (req, res) => {
  const result = await TransferService.validateTransfer(req.params.id, req.user._id);
  return success(res, result);
};
// POST /api/transfers/:id/cancel
const cancelTransfer = async (req, res) => {
  const result = await TransferService.cancelTransfer(req.params.id, req.user._id);
  return success(res, result);
};

const deleteTransfer = async (req, res) => {
  const result = await TransferService.deleteTransfer(req.params.id);
  return success(res, result);
};

module.exports = { getTransfers, getTransferById, createTransfer, updateTransfer, validateTransfer, cancelTransfer, deleteTransfer };

const AdjustmentService = require('../services/adjustmentService');
const { success } = require('../utils/apiResponse');

// GET /api/adjustments
const getAdjustments = async (req, res) => {
  const result = await AdjustmentService.getAdjustments(req.query);
  return success(res, result);
};

// POST /api/adjustments
const createAdjustment = async (req, res) => {
  const result = await AdjustmentService.createAdjustment({ ...req.body, userId: req.user._id });
  return success(res, result, 201);
};

const getAdjustmentById = async (req, res) => {
  const result = await AdjustmentService.getAdjustmentById(req.params.id);
  return success(res, result);
};

module.exports = { getAdjustments, getAdjustmentById, createAdjustment };

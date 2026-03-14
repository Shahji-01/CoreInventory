const DeliveryService = require('../services/deliveryService');
const { success } = require('../utils/apiResponse');

// GET /api/deliveries
const getDeliveries = async (req, res) => {
  const result = await DeliveryService.getDeliveries(req.query);
  return success(res, result);
};

// POST /api/deliveries
const createDelivery = async (req, res) => {
  const result = await DeliveryService.createDelivery({ ...req.body, userId: req.user._id });
  return success(res, result, 201);
};

const getDeliveryById = async (req, res) => {
  const result = await DeliveryService.getDeliveryById(req.params.id);
  return success(res, result);
};

const updateDelivery = async (req, res) => {
  const result = await DeliveryService.updateDelivery(req.params.id, req.body);
  return success(res, result);
};

// POST /api/deliveries/:id/validate
const validateDelivery = async (req, res) => {
  const result = await DeliveryService.validateDelivery(req.params.id, req.user._id);
  return success(res, result);
};
// POST /api/deliveries/:id/cancel
const cancelDelivery = async (req, res) => {
  const result = await DeliveryService.cancelDelivery(req.params.id, req.user._id);
  return success(res, result);
};

const deleteDelivery = async (req, res) => {
  const result = await DeliveryService.deleteDelivery(req.params.id);
  return success(res, result);
};

module.exports = { getDeliveries, getDeliveryById, createDelivery, updateDelivery, validateDelivery, cancelDelivery, deleteDelivery };

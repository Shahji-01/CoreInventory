const WarehouseService = require('../services/warehouseService');
const { success } = require('../utils/apiResponse');

// GET /api/warehouses
const getWarehouses = async (req, res) => {
  const warehouses = await WarehouseService.getWarehouses();
  return success(res, warehouses);
};

// POST /api/warehouses
const createWarehouse = async (req, res) => {
  const warehouse = await WarehouseService.createWarehouse(req.body);
  return success(res, warehouse, 201);
};

// PUT /api/warehouses/:id
const updateWarehouse = async (req, res) => {
  const warehouse = await WarehouseService.updateWarehouse(req.params.id, req.body);
  return success(res, warehouse);
};

// DELETE /api/warehouses/:id
const deleteWarehouse = async (req, res) => {
  await WarehouseService.deleteWarehouse(req.params.id);
  return success(res, null);
};

module.exports = { getWarehouses, createWarehouse, updateWarehouse, deleteWarehouse };

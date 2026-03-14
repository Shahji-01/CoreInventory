const StockMovementService = require('../services/stockMovementService');
const { success } = require('../utils/apiResponse');

// GET /api/stock-movements
const getStockMovements = async (req, res) => {
  const result = await StockMovementService.getStockMovements(req.query);
  return success(res, result);
};

module.exports = { getStockMovements };

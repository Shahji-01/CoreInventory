const StockMovement = require('../models/StockMovement');
const Product = require('../models/Product');
const Warehouse = require('../models/Warehouse');

class StockMovementService {
  async getStockMovements({ productId, warehouseId, operationType, page = 1, limit = 20 }) {
    const filter = {};

    if (productId) filter.productId = productId;
    if (operationType) filter.operationType = operationType;
    if (warehouseId) {
      filter.$or = [
        { sourceWarehouseId: warehouseId },
        { destinationWarehouseId: warehouseId },
      ];
    }

    const total = await StockMovement.countDocuments(filter);
    const movements = await StockMovement.find(filter)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .lean();

    const data = await Promise.all(movements.map(async (m) => {
      const product = await Product.findById(m.productId).lean();
      const srcWH = m.sourceWarehouseId ? await Warehouse.findById(m.sourceWarehouseId).lean() : null;
      const dstWH = m.destinationWarehouseId ? await Warehouse.findById(m.destinationWarehouseId).lean() : null;
      
      return {
        id: m._id,
        operationType: m.operationType,
        productId: m.productId,
        productName: product?.name ?? 'Unknown',
        productSku: product?.sku ?? '',
        quantityChange: m.quantityChange,
        previousQuantity: m.previousQuantity,
        newQuantity: m.newQuantity,
        sourceWarehouseId: m.sourceWarehouseId,
        sourceWarehouseName: srcWH?.name ?? null,
        destinationWarehouseId: m.destinationWarehouseId,
        destinationWarehouseName: dstWH?.name ?? null,
        referenceDocument: m.referenceDocument,
        referenceId: m.referenceId,
        createdAt: m.createdAt,
      };
    }));

    return { 
      data, 
      total, 
      page: Number(page), 
      limit: Number(limit), 
      totalPages: Math.ceil(total / Number(limit)) 
    };
  }
}

module.exports = new StockMovementService();

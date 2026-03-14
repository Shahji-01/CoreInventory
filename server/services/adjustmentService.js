const Adjustment = require('../models/Adjustment');
const Product = require('../models/Product');
const Warehouse = require('../models/Warehouse');
const StockMovement = require('../models/StockMovement');
const { generateRef } = require('../utils/generateRef');

class AdjustmentService {
  async enrichAdjustment(a) {
    const warehouse = await Warehouse.findById(a.warehouseId).lean();

    // Convert old single-product structure to standard lines if needed
    let lines = a.lines || [];
    if (lines.length === 0 && a.productId) {
      lines = [{ productId: a.productId, adjustedQuantity: a.adjustedQuantity, difference: a.difference }];
    }

    const enrichedLines = await Promise.all(lines.map(async (line) => {
      const product = await Product.findById(line.productId).lean();
      return {
        productId: line.productId,
        productName: product?.name ?? 'Unknown',
        productSku: product?.sku ?? '',
        adjustedQuantity: line.adjustedQuantity ?? line.countedQuantity ?? 0,
        difference: line.difference ?? 0,
        previousQuantity: line.previousQuantity ?? 0
      };
    }));

    return {
      id: a._id,
      reference: a.reference,
      warehouseId: a.warehouseId,
      warehouseName: warehouse?.name ?? 'Unknown',
      status: a.status || 'done',
      lines: enrichedLines,
      reason: a.reason,
      notes: a.notes,
      createdAt: a.createdAt,
    };
  }

  async getAdjustments({ page = 1, limit = 50 }) {
    const total = await Adjustment.countDocuments();
    const adjustments = await Adjustment.find()
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .lean();

    const data = await Promise.all(adjustments.map(a => this.enrichAdjustment(a)));
    return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
  }

  async getAdjustmentById(id) {
    const adj = await Adjustment.findById(id).lean();
    if (!adj) {
      const error = new Error('Adjustment not found');
      error.statusCode = 404;
      throw error;
    }
    return await this.enrichAdjustment(adj);
  }

  async createAdjustment({ warehouseId, reason, notes, lines, userId }) {
    if (!warehouseId || !reason || !lines || lines.length === 0) {
      const error = new Error('warehouseId, reason, and lines are required');
      error.statusCode = 400;
      throw error;
    }

    const reference = generateRef('ADJ');
    const processedLines = [];

    // Process each line sequentially without transactions (works on standalone MongoDB)
    for (const line of lines) {
      const product = await Product.findById(line.productId);
      if (!product) {
        throw new Error(`Product ID ${line.productId} no longer exists`);
      }

      const prevQty = product.currentStock;
      const newQty = Number(line.countedQuantity);
      const diff = newQty - prevQty;

      processedLines.push({
        productId: line.productId,
        previousQuantity: prevQty,
        adjustedQuantity: newQty,
        difference: diff
      });

      // Update product stock
      await Product.findByIdAndUpdate(line.productId, { currentStock: newQty });

      // Create stock movement audit entry
      await StockMovement.create({
        operationType: 'adjustment',
        productId: line.productId,
        quantityChange: diff,
        previousQuantity: prevQty,
        newQuantity: newQty,
        destinationWarehouseId: warehouseId,
        referenceDocument: reference,
        userId: userId,
      });
    }

    // Create the adjustment document after all stock updates succeed
    const adjustment = await Adjustment.create({
      reference,
      warehouseId,
      lines: processedLines,
      status: 'done',
      reason,
      notes,
      userId
    });

    // Now backfill referenceId on the stock movements we created
    await StockMovement.updateMany(
      { referenceDocument: reference },
      { referenceId: adjustment._id }
    );

    return await this.enrichAdjustment(adjustment.toObject());
  }
}

module.exports = new AdjustmentService();

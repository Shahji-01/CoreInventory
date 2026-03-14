const mongoose = require('mongoose');
const Receipt = require('../models/Receipt');
const Product = require('../models/Product');
const Warehouse = require('../models/Warehouse');
const StockMovement = require('../models/StockMovement');
const { generateRef } = require('../utils/generateRef');

class ReceiptService {
  async enrichReceipt(r) {
    const warehouse = await Warehouse.findById(r.warehouseId).lean();
    const lines = await Promise.all((r.lines || []).map(async (line) => {
      const product = await Product.findById(line.productId).lean();
      return {
        productId: line.productId,
        productName: product?.name ?? line.productName ?? 'Unknown',
        productSku: product?.sku ?? line.productSku ?? '',
        quantity: line.quantity,
        unitCost: line.unitCost ?? (product ? product.costPrice : 0),
      };
    }));
    return {
      id: r._id,
      reference: r.reference,
      supplier: r.supplier || r.vendor || '',
      warehouseId: r.warehouseId,
      warehouseName: warehouse?.name ?? 'Unknown',
      status: r.status,
      lines,
      notes: r.notes,
      createdAt: r.createdAt,
      validatedAt: r.validatedAt,
    };
  }

  async getReceipts({ status, page = 1, limit = 50 }) {
    const filter = {};
    if (status) filter.status = status;

    const total = await Receipt.countDocuments(filter);
    const receipts = await Receipt.find(filter)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .lean();

    const data = await Promise.all(receipts.map(r => this.enrichReceipt(r)));
    return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
  }

  async getReceiptById(id) {
    const receipt = await Receipt.findById(id).lean();
    if (!receipt) {
      const error = new Error('Receipt not found');
      error.statusCode = 404;
      throw error;
    }
    return await this.enrichReceipt(receipt);
  }

  async updateReceipt(id, { supplier, warehouseId, lines, notes }) {
    const receipt = await Receipt.findById(id);
    if (!receipt) {
      const error = new Error('Receipt not found');
      error.statusCode = 404;
      throw error;
    }
    if (receipt.status !== 'draft') {
      const error = new Error('Only draft receipts can be updated');
      error.statusCode = 400;
      throw error;
    }
    receipt.supplier = supplier || receipt.supplier;
    receipt.warehouseId = warehouseId || receipt.warehouseId;
    receipt.lines = lines || receipt.lines;
    receipt.notes = notes !== undefined ? notes : receipt.notes;
    await receipt.save();
    return await this.enrichReceipt(receipt.toObject());
  }

  async deleteReceipt(id) {
    const receipt = await Receipt.findById(id);
    if (!receipt) {
      const error = new Error('Receipt not found');
      error.statusCode = 404;
      throw error;
    }
    if (receipt.status !== 'draft') {
      const error = new Error('Only draft receipts can be deleted');
      error.statusCode = 400;
      throw error;
    }
    await Receipt.findByIdAndDelete(id);
    return true;
  }

  async createReceipt({ supplier, warehouseId, lines, notes, userId }) {
    if (!supplier || !warehouseId || !lines || lines.length === 0) {
      const error = new Error('Supplier, warehouseId, and lines are required');
      error.statusCode = 400;
      throw error;
    }

    const reference = generateRef('REC');
    const receipt = await Receipt.create({ 
      reference, supplier, warehouseId, status: 'draft', lines, notes, userId 
    });
    
    return await this.enrichReceipt(receipt.toObject());
  }

  async validateReceipt(id, userId) {
    const receipt = await Receipt.findById(id);
    if (!receipt) {
      const error = new Error('Receipt not found');
      error.statusCode = 404;
      throw error;
    }
    if (receipt.status !== 'draft') {
      const error = new Error('Receipt cannot be validated — it is already done or cancelled');
      error.statusCode = 400;
      throw error;
    }

    try {
      for (const line of receipt.lines) {
        const product = await Product.findById(line.productId);
        if (!product) continue;

        const prevQty = product.currentStock;
        const newQty = prevQty + line.quantity;
        
        // Update product stock
        await Product.findByIdAndUpdate(
          line.productId, 
          { currentStock: newQty }
        );

        // Create audit ledger entry within transaction
        const stockMove = new StockMovement({
          operationType: 'receipt',
          productId: line.productId,
          quantityChange: line.quantity,
          previousQuantity: prevQty,
          newQuantity: newQty,
          destinationWarehouseId: receipt.warehouseId,
          referenceDocument: receipt.reference,
          referenceId: receipt._id,
          userId: userId,
        });
        await stockMove.save();
      }

      receipt.status = 'done';
      receipt.validatedAt = new Date();
      await receipt.save();

      return await this.enrichReceipt(receipt.toObject());
      
    } catch (error) {
      throw error;
    }
  }

  async cancelReceipt(id, userId) {
    const receipt = await Receipt.findById(id);
    if (!receipt) {
      const error = new Error('Receipt not found');
      error.statusCode = 404;
      throw error;
    }
    if (receipt.status !== 'draft') {
      const error = new Error('Only draft receipts can be cancelled');
      error.statusCode = 400;
      throw error;
    }

    receipt.status = 'cancelled';
    await receipt.save();
    return await this.enrichReceipt(receipt.toObject());
  }
}

module.exports = new ReceiptService();

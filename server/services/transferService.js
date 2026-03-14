const mongoose = require('mongoose');
const Transfer = require('../models/Transfer');
const Product = require('../models/Product');
const Warehouse = require('../models/Warehouse');
const StockMovement = require('../models/StockMovement');
const { generateRef } = require('../utils/generateRef');

class TransferService {
  async enrichTransfer(t) {
    const fromWH = await Warehouse.findById(t.fromWarehouseId).lean();
    const toWH = await Warehouse.findById(t.toWarehouseId).lean();
    const lines = await Promise.all((t.lines || []).map(async (line) => {
      const product = await Product.findById(line.productId).lean();
      return {
        productId: line.productId,
        productName: product?.name ?? line.productName ?? 'Unknown',
        productSku: product?.sku ?? line.productSku ?? '',
        quantity: line.quantity,
      };
    }));
    return {
      id: t._id,
      reference: t.reference,
      fromWarehouseId: t.fromWarehouseId,
      fromWarehouseName: fromWH?.name ?? 'Unknown',
      toWarehouseId: t.toWarehouseId,
      toWarehouseName: toWH?.name ?? 'Unknown',
      status: t.status,
      lines,
      notes: t.notes,
      createdAt: t.createdAt,
      completedAt: t.completedAt,
    };
  }

  async getTransfers({ status, page = 1, limit = 50 }) {
    const filter = {};
    if (status) filter.status = status;

    const total = await Transfer.countDocuments(filter);
    const transfers = await Transfer.find(filter)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .lean();

    const data = await Promise.all(transfers.map(t => this.enrichTransfer(t)));
    return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
  }

  async getTransferById(id) {
    const transfer = await Transfer.findById(id).lean();
    if (!transfer) {
      const error = new Error('Transfer not found');
      error.statusCode = 404;
      throw error;
    }
    return await this.enrichTransfer(transfer);
  }

  async updateTransfer(id, { fromWarehouseId, toWarehouseId, lines, notes }) {
    const transfer = await Transfer.findById(id);
    if (!transfer) {
      const error = new Error('Transfer not found');
      error.statusCode = 404;
      throw error;
    }
    if (transfer.status !== 'draft') {
      const error = new Error('Only draft transfers can be updated');
      error.statusCode = 400;
      throw error;
    }
    if (fromWarehouseId === toWarehouseId) {
      const error = new Error('Source and destination warehouses must be different');
      error.statusCode = 400;
      throw error;
    }
    transfer.fromWarehouseId = fromWarehouseId || transfer.fromWarehouseId;
    transfer.toWarehouseId = toWarehouseId || transfer.toWarehouseId;
    transfer.lines = lines || transfer.lines;
    transfer.notes = notes !== undefined ? notes : transfer.notes;
    await transfer.save();
    return await this.enrichTransfer(transfer.toObject());
  }

  async deleteTransfer(id) {
    const transfer = await Transfer.findById(id);
    if (!transfer) {
      const error = new Error('Transfer not found');
      error.statusCode = 404;
      throw error;
    }
    if (transfer.status !== 'draft') {
      const error = new Error('Only draft transfers can be deleted');
      error.statusCode = 400;
      throw error;
    }
    await Transfer.findByIdAndDelete(id);
    return true;
  }

  async createTransfer({ fromWarehouseId, toWarehouseId, lines, notes, userId }) {
    if (!fromWarehouseId || !toWarehouseId || !lines || lines.length === 0) {
      const error = new Error('fromWarehouseId, toWarehouseId, and lines are required');
      error.statusCode = 400;
      throw error;
    }
    if (fromWarehouseId === toWarehouseId) {
      const error = new Error('Source and destination warehouses must be different');
      error.statusCode = 400;
      throw error;
    }

    const reference = generateRef('TRF');
    const transfer = await Transfer.create({ 
      reference, fromWarehouseId, toWarehouseId, status: 'draft', lines, notes, userId 
    });
    
    return await this.enrichTransfer(transfer.toObject());
  }

  async validateTransfer(id, userId) {
    const transfer = await Transfer.findById(id);
    if (!transfer) {
      const error = new Error('Transfer not found');
      error.statusCode = 404;
      throw error;
    }
    if (transfer.status !== 'draft') {
      const error = new Error('Transfer cannot be validated — it is already done or cancelled');
      error.statusCode = 400;
      throw error;
    }

    try {
      for (const line of transfer.lines) {
        const product = await Product.findById(line.productId);
        if (!product) {
          throw new Error(`Product ID ${line.productId} no longer exists`);
        }

        const prevQty = product.currentStock;

        // Generate paired audit ledger for global stock tracking

        await StockMovement.create({
          operationType: 'transfer_out',
          productId: line.productId,
          quantityChange: -line.quantity,
          previousQuantity: prevQty,
          newQuantity: prevQty,
          sourceWarehouseId: transfer.fromWarehouseId,
          destinationWarehouseId: transfer.toWarehouseId,
          referenceDocument: transfer.reference,
          referenceId: transfer._id,
          userId: userId,
        });

        await StockMovement.create({
          operationType: 'transfer_in',
          productId: line.productId,
          quantityChange: line.quantity,
          previousQuantity: prevQty,
          newQuantity: prevQty,
          sourceWarehouseId: transfer.fromWarehouseId,
          destinationWarehouseId: transfer.toWarehouseId,
          referenceDocument: transfer.reference,
          referenceId: transfer._id,
          userId: userId,
        });
      }

      transfer.status = 'done';
      transfer.completedAt = new Date();
      await transfer.save();

      return await this.enrichTransfer(transfer.toObject());
      
    } catch (error) {
      error.statusCode = error.statusCode || 500;
      throw error;
    }
  }

  async cancelTransfer(id, userId) {
    const transfer = await Transfer.findById(id);
    if (!transfer) {
      const error = new Error('Transfer not found');
      error.statusCode = 404;
      throw error;
    }
    if (transfer.status !== 'draft') {
      const error = new Error('Only draft transfers can be cancelled');
      error.statusCode = 400;
      throw error;
    }

    transfer.status = 'cancelled';
    await transfer.save();
    return await this.enrichTransfer(transfer.toObject());
  }
}

module.exports = new TransferService();

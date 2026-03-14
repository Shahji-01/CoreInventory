const mongoose = require('mongoose');
const Delivery = require('../models/Delivery');
const Product = require('../models/Product');
const Warehouse = require('../models/Warehouse');
const StockMovement = require('../models/StockMovement');
const { generateRef } = require('../utils/generateRef');

class DeliveryService {
  async enrichDelivery(d) {
    const warehouse = await Warehouse.findById(d.warehouseId).lean();
    const lines = await Promise.all((d.lines || []).map(async (line) => {
      const product = await Product.findById(line.productId).lean();
      return {
        productId: line.productId,
        productName: product?.name ?? line.productName ?? 'Unknown',
        productSku: product?.sku ?? line.productSku ?? '',
        quantity: line.quantity,
        unitPrice: line.unitPrice ?? (product ? (product.sellingPrice ?? product.costPrice) : 0),
      };
    }));
    return {
      id: d._id,
      reference: d.reference,
      customer: d.customer,
      warehouseId: d.warehouseId,
      warehouseName: warehouse?.name ?? 'Unknown',
      status: d.status,
      lines,
      notes: d.notes,
      createdAt: d.createdAt,
      validatedAt: d.validatedAt,
    };
  }

  async getDeliveries({ status, page = 1, limit = 50 }) {
    const filter = {};
    if (status) filter.status = status;

    const total = await Delivery.countDocuments(filter);
    const deliveries = await Delivery.find(filter)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .lean();

    const data = await Promise.all(deliveries.map(d => this.enrichDelivery(d)));
    return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
  }

  async getDeliveryById(id) {
    const delivery = await Delivery.findById(id).lean();
    if (!delivery) {
      const error = new Error('Delivery not found');
      error.statusCode = 404;
      throw error;
    }
    return await this.enrichDelivery(delivery);
  }

  async updateDelivery(id, { customer, warehouseId, lines, notes }) {
    const delivery = await Delivery.findById(id);
    if (!delivery) {
      const error = new Error('Delivery not found');
      error.statusCode = 404;
      throw error;
    }
    if (delivery.status !== 'draft') {
      const error = new Error('Only draft deliveries can be updated');
      error.statusCode = 400;
      throw error;
    }
    delivery.customer = customer || delivery.customer;
    delivery.warehouseId = warehouseId || delivery.warehouseId;
    delivery.lines = lines || delivery.lines;
    delivery.notes = notes !== undefined ? notes : delivery.notes;
    await delivery.save();
    return await this.enrichDelivery(delivery.toObject());
  }

  async deleteDelivery(id) {
    const delivery = await Delivery.findById(id);
    if (!delivery) {
      const error = new Error('Delivery not found');
      error.statusCode = 404;
      throw error;
    }
    if (delivery.status !== 'draft') {
      const error = new Error('Only draft deliveries can be deleted');
      error.statusCode = 400;
      throw error;
    }
    await Delivery.findByIdAndDelete(id);
    return true;
  }

  async createDelivery({ customer, warehouseId, lines, notes, userId }) {
    if (!customer || !warehouseId || !lines || lines.length === 0) {
      const error = new Error('Customer, warehouseId, and lines are required');
      error.statusCode = 400;
      throw error;
    }

    const reference = generateRef('DEL');
    const delivery = await Delivery.create({ 
      reference, customer, warehouseId, status: 'draft', lines, notes, userId 
    });
    
    return await this.enrichDelivery(delivery.toObject());
  }

  async validateDelivery(id, userId) {
    const delivery = await Delivery.findById(id);
    if (!delivery) {
      const error = new Error('Delivery not found');
      error.statusCode = 404;
      throw error;
    }
    if (delivery.status !== 'draft') {
      const error = new Error('Delivery cannot be validated — it is already done or cancelled');
      error.statusCode = 400;
      throw error;
    }

    try {
      for (const line of delivery.lines) {
        // Fetch product strictly without session for standalone DB compat
        const product = await Product.findById(line.productId);
        if (!product) {
          throw new Error(`Product ID ${line.productId} no longer exists`);
        }

        const prevQty = product.currentStock;
        const newQty = prevQty - line.quantity;

        // Prevent Negative Stock in a production SaaS
        if (newQty < 0) {
          const error = new Error(`Insufficient stock for ${product.name} (SKU: ${product.sku}). Available: ${prevQty}, Requested: ${line.quantity}`);
          error.statusCode = 400;
          throw error;
        }

        // Update product stock
        await Product.findByIdAndUpdate(
          line.productId, 
          { currentStock: newQty }
        );

        // Create audit ledger entry within transaction
        const stockMove = new StockMovement({
          operationType: 'delivery',
          productId: line.productId,
          quantityChange: -line.quantity, // Negative for delivery
          previousQuantity: prevQty,
          newQuantity: newQty,
          sourceWarehouseId: delivery.warehouseId,
          referenceDocument: delivery.reference,
          referenceId: delivery._id,
          userId: userId,
        });
        await stockMove.save();
      }

      delivery.status = 'done';
      delivery.validatedAt = new Date();
      await delivery.save();

      return await this.enrichDelivery(delivery.toObject());
      
    } catch (error) {
      // Only attach 400 if it's our custom thrown error from above
      error.statusCode = error.statusCode || 500;
      throw error;
    }
  }

  async cancelDelivery(id, userId) {
    const delivery = await Delivery.findById(id);
    if (!delivery) {
      const error = new Error('Delivery not found');
      error.statusCode = 404;
      throw error;
    }
    if (delivery.status !== 'draft') {
      const error = new Error('Only draft deliveries can be cancelled');
      error.statusCode = 400;
      throw error;
    }

    delivery.status = 'cancelled';
    await delivery.save();
    return await this.enrichDelivery(delivery.toObject());
  }
}

module.exports = new DeliveryService();

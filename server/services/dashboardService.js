const Product = require('../models/Product');
const Receipt = require('../models/Receipt');
const Delivery = require('../models/Delivery');
const Transfer = require('../models/Transfer');
const StockMovement = require('../models/StockMovement');
const Warehouse = require('../models/Warehouse');
const WarehouseService = require('./warehouseService');

class DashboardService {
  async getDashboardData() {
    const [products, receipts, deliveries, transfers, movements, warehouses] = await Promise.all([
      Product.find().lean(),
      Receipt.find().lean(),
      Delivery.find().lean(),
      Transfer.find().lean(),
      StockMovement.find().sort({ createdAt: 1 }).lean(),
      WarehouseService.getWarehouses(),
    ]);

    const lowStockItems = products.filter(p => p.currentStock > 0 && p.currentStock <= p.reorderLevel).length;
    const outOfStockItems = products.filter(p => p.currentStock <= 0).length;
    const pendingReceipts = receipts.filter(r => r.status === 'draft').length;
    const pendingDeliveries = deliveries.filter(d => d.status === 'draft').length;
    const scheduledTransfers = transfers.filter(t => t.status === 'draft').length;
    const totalStockValue = products.reduce((sum, p) => sum + (p.currentStock * p.costPrice), 0);

    // Stock by category
    const categoryMap = {};
    for (const p of products) {
      if (!categoryMap[p.category]) categoryMap[p.category] = { count: 0, value: 0 };
      categoryMap[p.category].count += p.currentStock;
      categoryMap[p.category].value += p.currentStock * p.costPrice;
    }
    const stockByCategory = Object.entries(categoryMap).map(([category, data]) => ({ category, ...data }));

    // Movement trend last 7 days
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });
    
    const movementTrend = last7Days.map(date => {
      const dayMovements = movements.filter(m => new Date(m.createdAt).toISOString().startsWith(date));
      return {
        date,
        receipts: dayMovements.filter(m => m.operationType === 'receipt').length,
        deliveries: dayMovements.filter(m => m.operationType === 'delivery').length,
        transfers: dayMovements.filter(m => m.operationType === 'transfer_in').length,
        adjustments: dayMovements.filter(m => m.operationType === 'adjustment').length,
      };
    });

    // Warehouse utilization
    const warehouseUtilization = warehouses.map(w => ({
      warehouseId: w._id,
      warehouseName: w.name,
      totalItems: w.currentItems,
      capacity: w.capacity,
      utilizationPercent: w.capacity > 0 ? Math.round((w.currentItems / w.capacity) * 100) : 0,
    }));

    // Recent movements (last 10, enriched)
    const recent = [...movements].reverse().slice(0, 10);
    const recentMovements = await Promise.all(recent.map(async (m) => {
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

    // Low stock products details
    const lowStockProducts = products
      .filter(p => p.currentStock <= p.reorderLevel)
      .sort((a, b) => a.currentStock - b.currentStock)
      .slice(0, 5)
      .map(p => ({
        id: p._id,
        sku: p.sku,
        name: p.name,
        category: p.category,
        unit: p.unit,
        costPrice: p.costPrice,
        sellingPrice: p.sellingPrice,
        reorderLevel: p.reorderLevel,
        currentStock: p.currentStock,
        status: p.currentStock <= 0 ? 'out_of_stock' : 'low_stock',
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      }));

    return {
      totalProducts: products.length,
      lowStockItems,
      outOfStockItems,
      pendingReceipts,
      pendingDeliveries,
      scheduledTransfers,
      totalStockValue,
      recentMovements,
      stockByCategory,
      movementTrend,
      warehouseUtilization,
      lowStockProducts,
    };
  }
}

module.exports = new DashboardService();

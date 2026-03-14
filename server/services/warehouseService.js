const Warehouse = require('../models/Warehouse');
const StockMovement = require('../models/StockMovement');

class WarehouseService {
  async getWarehouses() {
    const warehouses = await Warehouse.find().sort({ name: 1 }).lean();

    // Aggregate stock movements to find current items per warehouse in real-time
    const movements = await StockMovement.aggregate([
      {
        $project: {
          warehouseId: {
            $cond: {
              if: { $in: ["$operationType", ["receipt", "adjustment", "transfer_in"]] },
              then: "$destinationWarehouseId",
              else: "$sourceWarehouseId" // delivery, transfer_out
            }
          },
          quantityChange: 1
        }
      },
      {
        $group: {
          _id: "$warehouseId",
          totalItems: { $sum: "$quantityChange" }
        }
      }
    ]);

    const itemsMap = new Map(movements.map(m => [m._id?.toString(), m.totalItems]));

    return warehouses.map(w => ({
      ...w,
      currentItems: Math.max(0, itemsMap.get(w._id.toString()) || 0)
    }));
  }

  async createWarehouse({ name, code, location, type, capacity }) {
    if (!name || !code) {
      const error = new Error('Name and code are required');
      error.statusCode = 400;
      throw error;
    }

    const existing = await Warehouse.findOne({ code: code.toUpperCase() });
    if (existing) {
      const error = new Error('Warehouse code already exists');
      error.statusCode = 409;
      throw error;
    }

    return await Warehouse.create({ name, code, location, type, capacity });
  }

  async updateWarehouse(id, updateData) {
    const warehouse = await Warehouse.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    if (!warehouse) {
      const error = new Error('Warehouse not found');
      error.statusCode = 404;
      throw error;
    }
    return warehouse;
  }

  async deleteWarehouse(id) {
    const warehouse = await Warehouse.findByIdAndDelete(id);
    if (!warehouse) {
      const error = new Error('Warehouse not found');
      error.statusCode = 404;
      throw error;
    }
    return true;
  }
}

module.exports = new WarehouseService();

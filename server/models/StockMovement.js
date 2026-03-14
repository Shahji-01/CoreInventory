const mongoose = require('mongoose');

const stockMovementSchema = new mongoose.Schema({
  operationType: {
    type: String,
    enum: ['receipt', 'delivery', 'transfer_in', 'transfer_out', 'adjustment'],
    required: true,
  },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantityChange: { type: Number, required: true },
  previousQuantity: { type: Number, required: true },
  newQuantity: { type: Number, required: true },
  sourceWarehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', default: null },
  destinationWarehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', default: null },
  referenceDocument: { type: String, default: '' },
  referenceId: { type: mongoose.Schema.Types.ObjectId, default: null },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

stockMovementSchema.index({ productId: 1 });
stockMovementSchema.index({ operationType: 1 });
stockMovementSchema.index({ createdAt: -1 });

stockMovementSchema.set('toJSON', {
  transform: (_, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('StockMovement', stockMovementSchema);

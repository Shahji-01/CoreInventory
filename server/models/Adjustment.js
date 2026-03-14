const mongoose = require('mongoose');

const adjustmentLineSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  previousQuantity: { type: Number, default: 0 },
  adjustedQuantity: { type: Number, required: true },
  difference: { type: Number, default: 0 },
}, { _id: false });

const adjustmentSchema = new mongoose.Schema({
  reference: { type: String, required: true, unique: true },
  warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  lines: [adjustmentLineSchema],
  status: { type: String, enum: ['draft', 'done'], default: 'done' },
  reason: { type: String, enum: ['inventory_count', 'damage', 'loss', 'other'], required: true },
  notes: { type: String, default: '' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

adjustmentSchema.set('toJSON', {
  transform: (_, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Adjustment', adjustmentSchema);

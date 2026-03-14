const mongoose = require('mongoose');

const transferLineSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: String,
  productSku: String,
  quantity: { type: Number, required: true, min: 1 },
}, { _id: false });

const transferSchema = new mongoose.Schema({
  reference: { type: String, required: true, unique: true },
  fromWarehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  toWarehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  status: { type: String, enum: ['draft', 'confirmed', 'done', 'cancelled'], default: 'draft' },
  lines: [transferLineSchema],
  notes: { type: String, default: '' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  completedAt: { type: Date, default: null },
}, { timestamps: true });

transferSchema.set('toJSON', {
  transform: (_, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Transfer', transferSchema);

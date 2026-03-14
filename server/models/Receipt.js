const mongoose = require('mongoose');

const receiptLineSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: String,
  productSku: String,
  quantity: { type: Number, required: true, min: 1 },
  unitCost: { type: Number, default: 0 },
}, { _id: false });

const receiptSchema = new mongoose.Schema({
  reference: { type: String, required: true, unique: true },
  supplier: { type: String, required: true },
  warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  status: { type: String, enum: ['draft', 'done', 'cancelled'], default: 'draft' },
  lines: [receiptLineSchema],
  notes: { type: String, default: '' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  validatedAt: { type: Date, default: null },
}, { timestamps: true });

receiptSchema.set('toJSON', {
  transform: (_, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Receipt', receiptSchema);

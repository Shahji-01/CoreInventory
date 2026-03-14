const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  sku: { type: String, required: true, unique: true, uppercase: true, trim: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  category: { type: String, required: true, trim: true },
  unit: { type: String, required: true, default: 'pcs' },
  costPrice: { type: Number, required: true, default: 0, min: 0 },
  sellingPrice: { type: Number, default: null, min: 0 },
  reorderLevel: { type: Number, required: true, default: 10, min: 0 },
  currentStock: { type: Number, required: true, default: 0, min: 0 },
}, { timestamps: true });

productSchema.virtual('status').get(function () {
  if (this.currentStock <= 0) return 'out_of_stock';
  if (this.currentStock <= this.reorderLevel) return 'low_stock';
  return 'active';
});

productSchema.set('toJSON', {
  virtuals: true,
  transform: (_, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Product', productSchema);

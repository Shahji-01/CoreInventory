const mongoose = require('mongoose');

const warehouseSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  location: { type: String, default: '' },
  type: { type: String, enum: ['main', 'production', 'storage', 'transit'], default: 'storage' },
  capacity: { type: Number, default: 1000, min: 0 },
  currentItems: { type: Number, default: 0, min: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

warehouseSchema.set('toJSON', {
  transform: (_, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Warehouse', warehouseSchema);

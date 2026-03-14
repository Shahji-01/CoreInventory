const Product = require('../models/Product');

/**
 * Service for handling Product business logic and database operations
 */
class ProductService {
  async getProducts({ search, category, status, page = 1, limit = 20 }) {
    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
      ];
    }
    if (category) filter.category = category;

    let products = await Product.find(filter).sort({ createdAt: -1 });

    // Filter by computed status virtual
    if (status) {
      products = products.filter(p => {
        if (status === 'out_of_stock') return p.currentStock <= 0;
        if (status === 'low_stock') return p.currentStock > 0 && p.currentStock <= p.reorderLevel;
        if (status === 'active') return p.currentStock > p.reorderLevel;
        return true;
      });
    }

    const total = products.length;
    const offset = (Number(page) - 1) * Number(limit);
    const paginated = products.slice(offset, offset + Number(limit));

    return { 
      data: paginated, 
      total, 
      page: Number(page), 
      limit: Number(limit), 
      totalPages: Math.ceil(total / Number(limit)) 
    };
  }

  async createProduct({ sku, name, description, category, unit, costPrice, sellingPrice, reorderLevel }) {
    if (!sku || !name || !category) {
      const error = new Error('SKU, name, and category are required');
      error.statusCode = 400;
      throw error;
    }

    const existing = await Product.findOne({ sku: sku.toUpperCase() });
    if (existing) {
      const error = new Error('SKU already exists');
      error.statusCode = 409;
      throw error;
    }

    return await Product.create({ sku, name, description, category, unit, costPrice, sellingPrice, reorderLevel });
  }

  async getProductById(id) {
    const product = await Product.findById(id);
    if (!product) {
      const error = new Error('Product not found');
      error.statusCode = 404;
      throw error;
    }
    return product;
  }

  async updateProduct(id, updateData) {
    const product = await Product.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    if (!product) {
      const error = new Error('Product not found');
      error.statusCode = 404;
      throw error;
    }
    return product;
  }

  async deleteProduct(id) {
    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      const error = new Error('Product not found');
      error.statusCode = 404;
      throw error;
    }
    return true;
  }
}

module.exports = new ProductService();

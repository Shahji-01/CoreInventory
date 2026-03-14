const ProductService = require('../services/productService');
const { success } = require('../utils/apiResponse');

// GET /api/products
const getProducts = async (req, res) => {
  const result = await ProductService.getProducts(req.query);
  return success(res, result);
};

// POST /api/products
const createProduct = async (req, res) => {
  const product = await ProductService.createProduct(req.body);
  return success(res, product, 201);
};

// GET /api/products/:id
const getProduct = async (req, res) => {
  const product = await ProductService.getProductById(req.params.id);
  return success(res, product);
};

// PUT /api/products/:id
const updateProduct = async (req, res) => {
  const product = await ProductService.updateProduct(req.params.id, req.body);
  return success(res, product);
};

// DELETE /api/products/:id
const deleteProduct = async (req, res) => {
  await ProductService.deleteProduct(req.params.id);
  return success(res, null);
};

module.exports = { getProducts, createProduct, getProduct, updateProduct, deleteProduct };

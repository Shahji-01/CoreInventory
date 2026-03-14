const Product = require('../models/Product');
const Warehouse = require('../models/Warehouse');
const Receipt = require('../models/Receipt');
const Delivery = require('../models/Delivery');
const Transfer = require('../models/Transfer');
const Adjustment = require('../models/Adjustment');
const StockMovement = require('../models/StockMovement');
const User = require('../models/User');
const { generateRef } = require('../utils/generateRef');
const { hashPassword } = require('../utils/authUtils');

const DEMO_WAREHOUSES = [
  { name: 'Main Warehouse', code: 'WH-MAIN', location: 'Building A, Floor 1', type: 'main', capacity: 5000 },
  { name: 'Production Floor', code: 'WH-PROD', location: 'Building B, Floor 1', type: 'production', capacity: 2000 },
  { name: 'Rack A - Cold Storage', code: 'RACK-A', location: 'Building A, Floor 2', type: 'storage', capacity: 1000 },
  { name: 'Rack B - Electronics', code: 'RACK-B', location: 'Building C, Floor 1', type: 'storage', capacity: 800 },
];

const DEMO_PRODUCTS = [
  { sku: 'STL-ROD-6M', name: 'Steel Rods 6m', category: 'Raw Materials', unit: 'pcs', costPrice: 45, sellingPrice: 60, reorderLevel: 20 },
  { sku: 'BOLT-M12', name: 'Bolts M12 x 50', category: 'Fasteners', unit: 'box', costPrice: 12.5, sellingPrice: 18, reorderLevel: 50 },
  { sku: 'CHR-OFC-01', name: 'Office Chair Pro', category: 'Furniture', unit: 'pcs', costPrice: 180, sellingPrice: 299, reorderLevel: 5 },
  { sku: 'PCB-CTRL-V2', name: 'Control PCB v2', category: 'Electronics', unit: 'pcs', costPrice: 85, sellingPrice: 130, reorderLevel: 10 },
  { sku: 'PNL-SOL-250', name: 'Solar Panel 250W', category: 'Electronics', unit: 'pcs', costPrice: 220, sellingPrice: 350, reorderLevel: 8 },
  { sku: 'ALU-SHT-2M', name: 'Aluminum Sheet 2mm', category: 'Raw Materials', unit: 'sheet', costPrice: 35, sellingPrice: 50, reorderLevel: 30 },
  { sku: 'CBL-CAT6-50', name: 'CAT6 Cable 50m', category: 'Electronics', unit: 'roll', costPrice: 28, sellingPrice: 45, reorderLevel: 15 },
  { sku: 'NUT-M12-SS', name: 'Stainless Nuts M12', category: 'Fasteners', unit: 'bag', costPrice: 8.5, sellingPrice: 14, reorderLevel: 100 },
  { sku: 'BRKT-WALL-L', name: 'L-Wall Bracket', category: 'Mounting Hardware', unit: 'pcs', costPrice: 6, sellingPrice: 10, reorderLevel: 25 },
  { sku: 'MOTOR-DC-12V', name: 'DC Motor 12V 5A', category: 'Electronics', unit: 'pcs', costPrice: 55, sellingPrice: 89, reorderLevel: 8 },
  { sku: 'PIPE-PVC-1IN', name: 'PVC Pipe 1inch 3m', category: 'Plumbing', unit: 'length', costPrice: 9, sellingPrice: 15, reorderLevel: 40 },
  { sku: 'WIRE-CU-2.5', name: 'Copper Wire 2.5mm', category: 'Electronics', unit: 'm', costPrice: 2.5, sellingPrice: 4, reorderLevel: 200 },
];

const VENDORS = ['TechSupply Co.', 'Global Steel Ltd.', 'FastenerPro', 'Electronic World', 'RawMat Industries'];
const CUSTOMERS = ['Acme Corporation', 'BuildRight Ltd.', 'TechWorks Inc.', 'Modern Spaces', 'Industrial Solutions'];

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const daysAgo = (days) => { const d = new Date(); d.setDate(d.getDate() - days); return d; };

// POST /api/seed/demo
const seedDemo = async (req, res) => {
  // Clear existing data
  await Promise.all([
    StockMovement.deleteMany({}),
    Adjustment.deleteMany({}),
    Transfer.deleteMany({}),
    Delivery.deleteMany({}),
    Receipt.deleteMany({}),
    Product.deleteMany({}),
    Warehouse.deleteMany({}),
  ]);

  const demoUser = await User.findOne().lean();
  const userId = demoUser?._id;

  const warehouses = await Warehouse.insertMany(DEMO_WAREHOUSES);
  const mainWH = warehouses.find(w => w.code === 'WH-MAIN');
  const prodWH = warehouses.find(w => w.code === 'WH-PROD');
  const rackA = warehouses.find(w => w.code === 'RACK-A');
  const rackB = warehouses.find(w => w.code === 'RACK-B');

  const products = await Product.insertMany(DEMO_PRODUCTS.map(p => ({ ...p, currentStock: 0 })));

  let receiptCount = 0, deliveryCount = 0, transferCount = 0, adjustmentCount = 0, movementCount = 0;

  // Generate receipts
  for (let i = 0; i < 12; i++) {
    const dayOffset = randomInt(0, 30);
    const numProducts = randomInt(1, 4);
    const rProds = products.slice(0, numProducts);
    const lines = rProds.map(p => ({ productId: p._id, productName: p.name, productSku: p.sku, quantity: randomInt(20, 100), unitCost: p.costPrice }));
    const ref = generateRef('REC');
    const [receipt] = await Receipt.create([{ reference: ref, vendor: randomItem(VENDORS), warehouseId: randomItem([mainWH._id, rackB._id]), status: 'done', lines, userId, validatedAt: daysAgo(dayOffset), createdAt: daysAgo(dayOffset) }]);
    receiptCount++;

    for (const line of lines) {
      const prod = await Product.findById(line.productId);
      const prevQty = prod.currentStock;
      const newQty = prevQty + line.quantity;
      await Product.findByIdAndUpdate(line.productId, { currentStock: newQty });
      await StockMovement.create({ operationType: 'receipt', productId: line.productId, quantityChange: line.quantity, previousQuantity: prevQty, newQuantity: newQty, destinationWarehouseId: receipt.warehouseId, referenceDocument: ref, referenceId: receipt._id, userId, createdAt: daysAgo(dayOffset) });
      movementCount++;
    }
  }

  // Generate deliveries
  for (let i = 0; i < 8; i++) {
    const dayOffset = randomInt(0, 20);
    const numProducts = randomInt(1, 3);
    const dProds = products.slice(0, numProducts);
    const lines = dProds.map(p => ({ productId: p._id, productName: p.name, productSku: p.sku, quantity: randomInt(5, 30), unitPrice: p.sellingPrice ?? p.costPrice }));
    const ref = generateRef('DEL');
    const [delivery] = await Delivery.create([{ reference: ref, customer: randomItem(CUSTOMERS), warehouseId: mainWH._id, status: 'done', lines, userId, validatedAt: daysAgo(dayOffset), createdAt: daysAgo(dayOffset) }]);
    deliveryCount++;

    for (const line of lines) {
      const prod = await Product.findById(line.productId);
      const prevQty = prod.currentStock;
      const newQty = Math.max(0, prevQty - line.quantity);
      await Product.findByIdAndUpdate(line.productId, { currentStock: newQty });
      await StockMovement.create({ operationType: 'delivery', productId: line.productId, quantityChange: -line.quantity, previousQuantity: prevQty, newQuantity: newQty, sourceWarehouseId: delivery.warehouseId, referenceDocument: ref, referenceId: delivery._id, userId, createdAt: daysAgo(dayOffset) });
      movementCount++;
    }
  }

  // Generate transfers
  for (let i = 0; i < 5; i++) {
    const dayOffset = randomInt(0, 15);
    const tProd = randomItem(products);
    const qty = randomInt(10, 40);
    const fromWH = randomItem([mainWH._id, rackB._id]);
    const toWH = String(fromWH) === String(mainWH._id) ? prodWH._id : rackA._id;
    const ref = generateRef('TRF');
    const [transfer] = await Transfer.create([{ reference: ref, fromWarehouseId: fromWH, toWarehouseId: toWH, status: 'done', lines: [{ productId: tProd._id, productName: tProd.name, productSku: tProd.sku, quantity: qty }], userId, completedAt: daysAgo(dayOffset), createdAt: daysAgo(dayOffset) }]);
    transferCount++;
    const prevQty = (await Product.findById(tProd._id)).currentStock;
    await StockMovement.create({ operationType: 'transfer_out', productId: tProd._id, quantityChange: -qty, previousQuantity: prevQty, newQuantity: prevQty, sourceWarehouseId: fromWH, destinationWarehouseId: toWH, referenceDocument: ref, referenceId: transfer._id, userId, createdAt: daysAgo(dayOffset) });
    await StockMovement.create({ operationType: 'transfer_in', productId: tProd._id, quantityChange: qty, previousQuantity: prevQty, newQuantity: prevQty, sourceWarehouseId: fromWH, destinationWarehouseId: toWH, referenceDocument: ref, referenceId: transfer._id, userId, createdAt: daysAgo(dayOffset) });
    movementCount += 2;
  }

  // Generate adjustments
  for (let i = 0; i < 4; i++) {
    const dayOffset = randomInt(0, 10);
    const adjProd = await Product.findById(randomItem(products)._id);
    const adjQty = Math.max(1, adjProd.currentStock - randomInt(1, 5));
    const diff = adjQty - adjProd.currentStock;
    const ref = generateRef('ADJ');
    const [adj] = await Adjustment.create([{ reference: ref, warehouseId: mainWH._id, lines: [{ productId: adjProd._id, previousQuantity: adjProd.currentStock, adjustedQuantity: adjQty, difference: diff }], reason: randomItem(['damage', 'inventory_count', 'loss', 'other']), status: 'done', userId, createdAt: daysAgo(dayOffset) }]);
    adjustmentCount++;
    await Product.findByIdAndUpdate(adjProd._id, { currentStock: adjQty });
    await StockMovement.create({ operationType: 'adjustment', productId: adjProd._id, quantityChange: diff, previousQuantity: adjProd.currentStock, newQuantity: adjQty, destinationWarehouseId: mainWH._id, referenceDocument: ref, referenceId: adj._id, userId, createdAt: daysAgo(dayOffset) });
    movementCount++;
  }

  // Pending receipts (draft)
  for (let i = 0; i < 3; i++) {
    const p = randomItem(products);
    await Receipt.create({ reference: generateRef('REC'), vendor: randomItem(VENDORS), warehouseId: mainWH._id, status: 'draft', lines: [{ productId: p._id, productName: p.name, productSku: p.sku, quantity: randomInt(20, 50), unitCost: p.costPrice }], userId });
    receiptCount++;
  }
  // Pending deliveries
  for (let i = 0; i < 2; i++) {
    const p = randomItem(products);
    await Delivery.create({ reference: generateRef('DEL'), customer: randomItem(CUSTOMERS), warehouseId: mainWH._id, status: 'draft', lines: [{ productId: p._id, productName: p.name, productSku: p.sku, quantity: randomInt(5, 15) }], userId });
    deliveryCount++;
  }
  // Pending transfers
  for (let i = 0; i < 2; i++) {
    const p = randomItem(products);
    await Transfer.create({ reference: generateRef('TRF'), fromWarehouseId: mainWH._id, toWarehouseId: prodWH._id, status: 'confirmed', lines: [{ productId: p._id, productName: p.name, productSku: p.sku, quantity: randomInt(10, 25) }], userId });
    transferCount++;
  }

  // Update warehouse item counts
  for (const wh of warehouses) {
    const itemsInWH = movementCount > 0 ? randomInt(50, Math.min(wh.capacity - 1, 400)) : 0;
    await Warehouse.findByIdAndUpdate(wh._id, { currentItems: itemsInWH });
  }

  const updatedProducts = await Product.find();
  res.json({
    success: true,
    message: 'Demo data loaded successfully! The dashboard is now populated with realistic inventory data.',
    counts: { products: updatedProducts.length, warehouses: warehouses.length, receipts: receiptCount, deliveries: deliveryCount, transfers: transferCount, adjustments: adjustmentCount, movements: movementCount },
  });
};

// POST /api/seed/clear
const clearDemo = async (req, res) => {
  await Promise.all([
    StockMovement.deleteMany({}),
    Adjustment.deleteMany({}),
    Transfer.deleteMany({}),
    Delivery.deleteMany({}),
    Receipt.deleteMany({}),
    Product.deleteMany({}),
    Warehouse.deleteMany({}),
  ]);
  res.json({ success: true, message: 'All demo data cleared successfully.', counts: { products: 0, warehouses: 0, receipts: 0, deliveries: 0, transfers: 0, adjustments: 0, movements: 0 } });
};

module.exports = { seedDemo, clearDemo };

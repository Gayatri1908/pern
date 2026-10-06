const { get, all, run } = require('../database/db');

async function listProducts(req, res, next) {
  try {
    const products = await all(`
      SELECT
        id,
        sku,
        name,
        description,
        unit_price,
        physical_quantity,
        reserved_quantity,
        (physical_quantity - reserved_quantity) AS available_quantity,
        created_at
      FROM products
      ORDER BY sku ASC
    `);
    return res.json({ success: true, count: products.length, data: products });
  } catch (err) {
    next(err);
  }
}

async function getProduct(req, res, next) {
  try {
    const { id } = req.params;
    const product = await get(`
      SELECT
        id,
        sku,
        name,
        description,
        unit_price,
        physical_quantity,
        reserved_quantity,
        (physical_quantity - reserved_quantity) AS available_quantity,
        created_at
      FROM products
      WHERE id = ? OR sku = ?
    `, [id, id]);

    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found.' });
    }
    return res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
}

async function updateStock(req, res, next) {
  try {
    const { id } = req.params;
    const { physical_quantity } = req.body;

    if (physical_quantity === undefined || Number(physical_quantity) < 0) {
      return res.status(400).json({ success: false, error: 'Valid physical_quantity is required.' });
    }

    const product = await get('SELECT * FROM products WHERE id = ?', [id]);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found.' });
    }

    if (Number(physical_quantity) < product.reserved_quantity) {
      return res.status(400).json({
        success: false,
        error: `Physical stock cannot be reduced below reserved quantity (${product.reserved_quantity}).`
      });
    }

    await run('UPDATE products SET physical_quantity = ? WHERE id = ?', [Number(physical_quantity), id]);

    const updated = await get(`
      SELECT
        id, sku, name, unit_price,
        physical_quantity, reserved_quantity,
        (physical_quantity - reserved_quantity) AS available_quantity
      FROM products WHERE id = ?
    `, [id]);

    return res.json({ success: true, message: 'Stock updated.', data: updated });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listProducts,
  getProduct,
  updateStock
};

const { get, all, run, withTransaction } = require('../database/db');

async function listEnquiries(req, res, next) {
  try {
    const enquiries = await all(`
      SELECT
        e.id,
        e.enquiry_number,
        e.status,
        e.notes,
        e.created_at,
        c.id AS customer_id,
        c.name AS customer_name,
        c.company AS customer_company,
        u.name AS created_by_name,
        COUNT(ei.id) AS item_count,
        COALESCE(SUM(ei.quantity), 0) AS total_units
      FROM enquiries e
      JOIN customers c ON e.customer_id = c.id
      JOIN users u ON e.created_by = u.id
      LEFT JOIN enquiry_items ei ON e.id = ei.enquiry_id
      GROUP BY e.id
      ORDER BY e.created_at DESC
    `);
    return res.json({ success: true, count: enquiries.length, data: enquiries });
  } catch (err) {
    next(err);
  }
}

async function getEnquiry(req, res, next) {
  try {
    const { id } = req.params;
    const enquiry = await get(`
      SELECT
        e.id,
        e.enquiry_number,
        e.status,
        e.notes,
        e.created_at,
        c.id AS customer_id,
        c.name AS customer_name,
        c.email AS customer_email,
        c.phone AS customer_phone,
        c.company AS customer_company,
        c.address AS customer_address,
        u.name AS created_by_name
      FROM enquiries e
      JOIN customers c ON e.customer_id = c.id
      JOIN users u ON e.created_by = u.id
      WHERE e.id = ? OR e.enquiry_number = ?
    `, [id, id]);

    if (!enquiry) {
      return res.status(404).json({ success: false, error: 'Enquiry not found.' });
    }

    const items = await all(`
      SELECT
        ei.id,
        ei.product_id,
        p.sku,
        p.name AS product_name,
        p.unit_price AS list_price,
        p.physical_quantity,
        p.reserved_quantity,
        (p.physical_quantity - p.reserved_quantity) AS available_quantity,
        ei.quantity,
        ei.target_price,
        ei.notes
      FROM enquiry_items ei
      JOIN products p ON ei.product_id = p.id
      WHERE ei.enquiry_id = ?
    `, [enquiry.id]);

    const quotations = await all(`
      SELECT id, quotation_number, status, total_amount, created_at
      FROM quotations
      WHERE enquiry_id = ?
      ORDER BY created_at DESC
    `, [enquiry.id]);

    return res.json({
      success: true,
      data: {
        ...enquiry,
        items,
        quotations
      }
    });
  } catch (err) {
    next(err);
  }
}

async function createEnquiry(req, res, next) {
  try {
    const { customer_id, items, notes } = req.body;

    if (!customer_id) {
      return res.status(400).json({ success: false, error: 'Customer is required.' });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'Enquiry must have at least one product item.' });
    }

    // Validate customer
    const customer = await get('SELECT id FROM customers WHERE id = ?', [customer_id]);
    if (!customer) {
      return res.status(400).json({ success: false, error: 'Selected customer does not exist.' });
    }

    // Validate products and quantities
    for (const item of items) {
      if (!item.product_id || !item.quantity || Number(item.quantity) <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Each item must have a valid product_id and quantity greater than 0.'
        });
      }
      const prod = await get('SELECT id FROM products WHERE id = ?', [item.product_id]);
      if (!prod) {
        return res.status(400).json({
          success: false,
          error: `Product ID ${item.product_id} not found.`
        });
      }
    }

    const enquiryId = `enq-${Date.now().toString(36)}`;
    const countRow = await get('SELECT COUNT(*) as cnt FROM enquiries');
    const seq = String((countRow ? countRow.cnt : 0) + 1).padStart(3, '0');
    const enquiryNumber = `ENQ-2026-${seq}`;

    await withTransaction(async (dbClient) => {
      await dbClient.run(`
        INSERT INTO enquiries (id, enquiry_number, customer_id, status, notes, created_by)
        VALUES (?, ?, ?, 'NEW', ?, ?)
      `, [enquiryId, enquiryNumber, customer_id, notes || null, req.user.id]);

      for (const item of items) {
        const itemId = `ei-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 4)}`;
        await dbClient.run(`
          INSERT INTO enquiry_items (id, enquiry_id, product_id, quantity, target_price, notes)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [
          itemId,
          enquiryId,
          item.product_id,
          Number(item.quantity),
          item.target_price ? Number(item.target_price) : null,
          item.notes || null
        ]);
      }
    });

    const created = await get(`
      SELECT e.*, c.name AS customer_name, c.company AS customer_company
      FROM enquiries e
      JOIN customers c ON e.customer_id = c.id
      WHERE e.id = ?
    `, [enquiryId]);

    const createdItems = await all(`
      SELECT ei.*, p.sku, p.name AS product_name
      FROM enquiry_items ei
      JOIN products p ON ei.product_id = p.id
      WHERE ei.enquiry_id = ?
    `, [enquiryId]);

    return res.status(201).json({
      success: true,
      message: 'Enquiry created successfully.',
      data: { ...created, items: createdItems }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listEnquiries,
  getEnquiry,
  createEnquiry
};

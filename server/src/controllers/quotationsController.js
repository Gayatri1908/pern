const { get, all, run, withTransaction } = require('../database/db');

async function listQuotations(req, res, next) {
  try {
    const quotations = await all(`
      SELECT
        q.id,
        q.quotation_number,
        q.enquiry_id,
        e.enquiry_number,
        q.status,
        q.subtotal,
        q.discount_pct,
        q.discount_amount,
        q.gst_rate_pct,
        q.gst_amount,
        q.total_amount,
        q.valid_until,
        q.sent_at,
        q.decision_at,
        q.created_at,
        c.name AS customer_name,
        c.company AS customer_company,
        u.name AS created_by_name,
        so.id AS sales_order_id,
        so.order_number AS sales_order_number
      FROM quotations q
      JOIN enquiries e ON q.enquiry_id = e.id
      JOIN customers c ON q.customer_id = c.id
      JOIN users u ON q.created_by = u.id
      LEFT JOIN sales_orders so ON q.id = so.quotation_id
      ORDER BY q.created_at DESC
    `);
    return res.json({ success: true, count: quotations.length, data: quotations });
  } catch (err) {
    next(err);
  }
}

async function getQuotation(req, res, next) {
  try {
    const { id } = req.params;
    const quotation = await get(`
      SELECT
        q.*,
        e.enquiry_number,
        e.notes AS enquiry_notes,
        c.name AS customer_name,
        c.email AS customer_email,
        c.phone AS customer_phone,
        c.company AS customer_company,
        c.address AS customer_address,
        u.name AS created_by_name,
        so.id AS sales_order_id,
        so.order_number AS sales_order_number,
        so.status AS sales_order_status
      FROM quotations q
      JOIN enquiries e ON q.enquiry_id = e.id
      JOIN customers c ON q.customer_id = c.id
      JOIN users u ON q.created_by = u.id
      LEFT JOIN sales_orders so ON q.id = so.quotation_id
      WHERE q.id = ? OR q.quotation_number = ?
    `, [id, id]);

    if (!quotation) {
      return res.status(404).json({ success: false, error: 'Quotation not found.' });
    }

    const items = await all(`
      SELECT
        qi.*,
        p.sku,
        p.name AS product_name,
        p.physical_quantity,
        p.reserved_quantity,
        (p.physical_quantity - p.reserved_quantity) AS available_quantity
      FROM quotation_items qi
      JOIN products p ON qi.product_id = p.id
      WHERE qi.quotation_id = ?
    `, [quotation.id]);

    return res.json({
      success: true,
      data: {
        ...quotation,
        items
      }
    });
  } catch (err) {
    next(err);
  }
}

async function createQuotation(req, res, next) {
  try {
    const {
      enquiry_id,
      items,
      discount_pct = 0,
      gst_rate_pct = 18.0,
      valid_until
    } = req.body;

    if (!enquiry_id) {
      return res.status(400).json({ success: false, error: 'Enquiry ID is required to create a quotation.' });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'Quotation must have at least one product line item.' });
    }

    // Verify enquiry
    const enquiry = await get('SELECT id, customer_id, status FROM enquiries WHERE id = ?', [enquiry_id]);
    if (!enquiry) {
      return res.status(404).json({ success: false, error: 'Enquiry not found.' });
    }

    // Validate and calculate item line totals
    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      if (!item.product_id || !item.quantity || Number(item.quantity) <= 0 || item.unit_price === undefined || Number(item.unit_price) < 0) {
        return res.status(400).json({
          success: false,
          error: 'Each item must have a valid product_id, quantity > 0, and unit_price >= 0.'
        });
      }

      const product = await get('SELECT id, name, unit_price FROM products WHERE id = ?', [item.product_id]);
      if (!product) {
        return res.status(400).json({ success: false, error: `Product ID ${item.product_id} not found.` });
      }

      const qty = Number(item.quantity);
      const price = Number(item.unit_price);
      const lineTotal = Number((qty * price).toFixed(2));
      subtotal += lineTotal;

      validatedItems.push({
        product_id: item.product_id,
        quantity: qty,
        unit_price: price,
        line_total: lineTotal
      });
    }

    // Calculate Discount and GST
    subtotal = Number(subtotal.toFixed(2));
    const discPct = Math.max(0, Math.min(100, Number(discount_pct) || 0));
    const discountAmount = Number(((subtotal * discPct) / 100).toFixed(2));
    const taxableAmount = Math.max(0, Number((subtotal - discountAmount).toFixed(2)));

    const gstPct = Number(gst_rate_pct) || 18.0;
    const gstAmount = Number(((taxableAmount * gstPct) / 100).toFixed(2));
    const totalAmount = Number((taxableAmount + gstAmount).toFixed(2));

    const quotationId = `quo-${Date.now().toString(36)}`;
    const countRow = await get('SELECT COUNT(*) as cnt FROM quotations');
    const seq = String((countRow ? countRow.cnt : 0) + 1).padStart(3, '0');
    const quotationNumber = `QUO-2026-${seq}`;

    await withTransaction(async (dbClient) => {
      await dbClient.run(`
        INSERT INTO quotations (
          id, quotation_number, enquiry_id, customer_id, status,
          subtotal, discount_pct, discount_amount, gst_rate_pct, gst_amount, total_amount,
          valid_until, created_by
        ) VALUES (?, ?, ?, ?, 'DRAFT', ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        quotationId,
        quotationNumber,
        enquiry_id,
        enquiry.customer_id,
        subtotal,
        discPct,
        discountAmount,
        gstPct,
        gstAmount,
        totalAmount,
        valid_until || null,
        req.user.id
      ]);

      for (const vi of validatedItems) {
        const itemId = `qi-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 4)}`;
        await dbClient.run(`
          INSERT INTO quotation_items (id, quotation_id, product_id, quantity, unit_price, line_total)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [itemId, quotationId, vi.product_id, vi.quantity, vi.unit_price, vi.line_total]);
      }

      // Update enquiry status to QUOTED
      await dbClient.run("UPDATE enquiries SET status = 'QUOTED' WHERE id = ?", [enquiry_id]);
    });

    const created = await get(`
      SELECT q.*, c.name AS customer_name, c.company AS customer_company
      FROM quotations q
      JOIN customers c ON q.customer_id = c.id
      WHERE q.id = ?
    `, [quotationId]);

    const createdItems = await all('SELECT * FROM quotation_items WHERE quotation_id = ?', [quotationId]);

    return res.status(201).json({
      success: true,
      message: 'Quotation generated successfully.',
      data: { ...created, items: createdItems }
    });
  } catch (err) {
    next(err);
  }
}

async function sendQuotation(req, res, next) {
  try {
    const { id } = req.params;
    const quotation = await get('SELECT * FROM quotations WHERE id = ?', [id]);
    if (!quotation) {
      return res.status(404).json({ success: false, error: 'Quotation not found.' });
    }

    if (quotation.status !== 'DRAFT') {
      return res.status(400).json({
        success: false,
        error: `Only DRAFT quotations can be marked as SENT. Current status: ${quotation.status}`
      });
    }

    await run("UPDATE quotations SET status = 'SENT', sent_at = datetime('now') WHERE id = ?", [id]);
    const updated = await get('SELECT * FROM quotations WHERE id = ?', [id]);
    return res.json({ success: true, message: 'Quotation sent to customer.', data: updated });
  } catch (err) {
    next(err);
  }
}

async function decideQuotation(req, res, next) {
  try {
    const { id } = req.params;
    const { decision } = req.body; // 'ACCEPTED' or 'REJECTED'

    if (!['ACCEPTED', 'REJECTED'].includes(decision)) {
      return res.status(400).json({ success: false, error: "Decision must be 'ACCEPTED' or 'REJECTED'." });
    }

    const quotation = await get('SELECT * FROM quotations WHERE id = ?', [id]);
    if (!quotation) {
      return res.status(404).json({ success: false, error: 'Quotation not found.' });
    }

    if (quotation.status === 'ORDERED') {
      return res.status(400).json({ success: false, error: 'Quotation has already been converted to a Sales Order.' });
    }

    await run("UPDATE quotations SET status = ?, decision_at = datetime('now') WHERE id = ?", [decision, id]);
    const updated = await get('SELECT * FROM quotations WHERE id = ?', [id]);
    return res.json({ success: true, message: `Quotation marked as ${decision}.`, data: updated });
  } catch (err) {
    next(err);
  }
}

// Convert ACCEPTED quotation to Sales Order
async function convertToSalesOrder(req, res, next) {
  try {
    const { id } = req.params;

    const quotation = await get('SELECT * FROM quotations WHERE id = ?', [id]);
    if (!quotation) {
      return res.status(404).json({ success: false, error: 'Quotation not found.' });
    }

    // STRICT CASE STUDY RULE: Only ACCEPTED quotations can be converted to Sales Orders
    if (quotation.status !== 'ACCEPTED') {
      return res.status(400).json({
        success: false,
        error: `Only ACCEPTED quotations can be converted to Sales Orders. Current status: ${quotation.status}`
      });
    }

    // Check if Sales Order already exists for this quotation
    const existingOrder = await get('SELECT id, order_number FROM sales_orders WHERE quotation_id = ?', [id]);
    if (existingOrder) {
      return res.status(400).json({
        success: false,
        error: `A Sales Order (${existingOrder.order_number}) already exists for this quotation.`
      });
    }

    const quotationItems = await all('SELECT * FROM quotation_items WHERE quotation_id = ?', [id]);
    if (quotationItems.length === 0) {
      return res.status(400).json({ success: false, error: 'Quotation has no line items.' });
    }

    const salesOrderId = `so-${Date.now().toString(36)}`;
    const countRow = await get('SELECT COUNT(*) as cnt FROM sales_orders');
    const seq = String((countRow ? countRow.cnt : 0) + 1).padStart(3, '0');
    const orderNumber = `SO-2026-${seq}`;

    await withTransaction(async (dbClient) => {
      // 1. Insert Sales Order with status PENDING
      await dbClient.run(`
        INSERT INTO sales_orders (
          id, order_number, quotation_id, enquiry_id, customer_id,
          status, total_amount
        ) VALUES (?, ?, ?, ?, ?, 'PENDING', ?)
      `, [
        salesOrderId,
        orderNumber,
        quotation.id,
        quotation.enquiry_id,
        quotation.customer_id,
        quotation.total_amount
      ]);

      // 2. Copy items from quotation to sales order
      for (const qi of quotationItems) {
        const soiId = `soi-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 4)}`;
        await dbClient.run(`
          INSERT INTO sales_order_items (id, sales_order_id, product_id, quantity, unit_price, line_total)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [soiId, salesOrderId, qi.product_id, qi.quantity, qi.unit_price, qi.line_total]);
      }

      // 3. Mark quotation as ORDERED
      await dbClient.run("UPDATE quotations SET status = 'ORDERED' WHERE id = ?", [id]);
    });

    const createdOrder = await get(`
      SELECT so.*, c.name AS customer_name, c.company AS customer_company, q.quotation_number, e.enquiry_number
      FROM sales_orders so
      JOIN customers c ON so.customer_id = c.id
      JOIN quotations q ON so.quotation_id = q.id
      JOIN enquiries e ON so.enquiry_id = e.id
      WHERE so.id = ?
    `, [salesOrderId]);

    const items = await all(`
      SELECT soi.*, p.sku, p.name AS product_name, p.physical_quantity, p.reserved_quantity,
        (p.physical_quantity - p.reserved_quantity) AS available_quantity
      FROM sales_order_items soi
      JOIN products p ON soi.product_id = p.id
      WHERE soi.sales_order_id = ?
    `, [salesOrderId]);

    return res.status(201).json({
      success: true,
      message: `Sales Order ${orderNumber} created from Quotation. Status is PENDING confirmation.`,
      data: { ...createdOrder, items }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listQuotations,
  getQuotation,
  createQuotation,
  sendQuotation,
  decideQuotation,
  convertToSalesOrder
};

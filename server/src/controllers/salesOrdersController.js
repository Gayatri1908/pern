const { get, all, run, withTransaction } = require('../database/db');

async function listSalesOrders(req, res, next) {
  try {
    const orders = await all(`
      SELECT
        so.id,
        so.order_number,
        so.quotation_id,
        q.quotation_number,
        so.enquiry_id,
        e.enquiry_number,
        so.customer_id,
        c.name AS customer_name,
        c.company AS customer_company,
        so.status,
        so.total_amount,
        so.confirmed_at,
        u_conf.name AS confirmed_by_name,
        so.dispatched_at,
        u_disp.name AS dispatched_by_name,
        so.dispatch_tracking_number,
        so.created_at,
        COUNT(soi.id) AS item_count,
        COALESCE(SUM(soi.quantity), 0) AS total_units
      FROM sales_orders so
      JOIN quotations q ON so.quotation_id = q.id
      JOIN enquiries e ON so.enquiry_id = e.id
      JOIN customers c ON so.customer_id = c.id
      LEFT JOIN users u_conf ON so.confirmed_by = u_conf.id
      LEFT JOIN users u_disp ON so.dispatched_by = u_disp.id
      LEFT JOIN sales_order_items soi ON so.id = soi.sales_order_id
      GROUP BY so.id
      ORDER BY so.created_at DESC
    `);
    return res.json({ success: true, count: orders.length, data: orders });
  } catch (err) {
    next(err);
  }
}

async function getSalesOrder(req, res, next) {
  try {
    const { id } = req.params;
    const order = await get(`
      SELECT
        so.*,
        q.quotation_number,
        q.subtotal AS quotation_subtotal,
        q.discount_pct,
        q.discount_amount,
        q.gst_rate_pct,
        q.gst_amount,
        e.enquiry_number,
        e.notes AS enquiry_notes,
        c.name AS customer_name,
        c.email AS customer_email,
        c.phone AS customer_phone,
        c.company AS customer_company,
        c.address AS customer_address,
        u_conf.name AS confirmed_by_name,
        u_disp.name AS dispatched_by_name
      FROM sales_orders so
      JOIN quotations q ON so.quotation_id = q.id
      JOIN enquiries e ON so.enquiry_id = e.id
      JOIN customers c ON so.customer_id = c.id
      LEFT JOIN users u_conf ON so.confirmed_by = u_conf.id
      LEFT JOIN users u_disp ON so.dispatched_by = u_disp.id
      WHERE so.id = ? OR so.order_number = ?
    `, [id, id]);

    if (!order) {
      return res.status(404).json({ success: false, error: 'Sales Order not found.' });
    }

    // Include stock availability calculation: Available = Physical - Reserved
    const items = await all(`
      SELECT
        soi.id,
        soi.sales_order_id,
        soi.product_id,
        p.sku,
        p.name AS product_name,
        soi.quantity,
        soi.unit_price,
        soi.line_total,
        p.physical_quantity,
        p.reserved_quantity,
        (p.physical_quantity - p.reserved_quantity) AS available_quantity,
        CASE
          WHEN (p.physical_quantity - p.reserved_quantity) >= soi.quantity THEN 1
          ELSE 0
        END AS has_sufficient_stock
      FROM sales_order_items soi
      JOIN products p ON soi.product_id = p.id
      WHERE soi.sales_order_id = ?
    `, [order.id]);

    const auditLogs = await all(`
      SELECT it.*, u.name AS user_name, p.name AS product_name, p.sku
      FROM inventory_transactions it
      JOIN products p ON it.product_id = p.id
      JOIN users u ON it.created_by = u.id
      WHERE it.sales_order_id = ?
      ORDER BY it.created_at DESC
    `, [order.id]);

    return res.json({
      success: true,
      data: {
        ...order,
        items,
        auditLogs
      }
    });
  } catch (err) {
    next(err);
  }
}

// ── CONFIRM SALES ORDER & RESERVE STOCK (ADMIN ONLY) ──────────
// Physical stock does NOT decrease during reservation.
// Reserved quantity increases.
async function confirmSalesOrder(req, res, next) {
  try {
    const { id } = req.params;

    const order = await get('SELECT * FROM sales_orders WHERE id = ?', [id]);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Sales Order not found.' });
    }

    if (order.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        error: `Only PENDING orders can be confirmed. Current status: ${order.status}`
      });
    }

    const items = await all('SELECT * FROM sales_order_items WHERE sales_order_id = ?', [id]);
    if (items.length === 0) {
      return res.status(400).json({ success: false, error: 'Order has no items.' });
    }

    // Execute in an ACID database transaction
    await withTransaction(async (dbClient) => {
      // 1. Verify available stock for every single product in the order
      for (const item of items) {
        const product = await dbClient.get('SELECT * FROM products WHERE id = ?', [item.product_id]);
        if (!product) {
          throw new Error(`Product ID ${item.product_id} no longer exists.`);
        }

        const available = product.physical_quantity - product.reserved_quantity;
        if (available < item.quantity) {
          throw new Error(
            `Insufficient available stock for ${product.name} (${product.sku}). ` +
            `Physical: ${product.physical_quantity}, Reserved: ${product.reserved_quantity}, ` +
            `Available: ${available}, Required: ${item.quantity}.`
          );
        }
      }

      // 2. Reserve stock: increase reserved_quantity. Physical stock MUST NOT DECREASE.
      for (const item of items) {
        const product = await dbClient.get('SELECT * FROM products WHERE id = ?', [item.product_id]);
        const prevReserved = product.reserved_quantity;
        const newReserved = prevReserved + item.quantity;

        await dbClient.run(
          'UPDATE products SET reserved_quantity = ? WHERE id = ?',
          [newReserved, item.product_id]
        );

        // Record inventory audit transaction
        const auditId = `tx-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 4)}`;
        await dbClient.run(`
          INSERT INTO inventory_transactions (
            id, product_id, sales_order_id, transaction_type, quantity,
            previous_physical, new_physical, previous_reserved, new_reserved, created_by
          ) VALUES (?, ?, ?, 'RESERVED', ?, ?, ?, ?, ?, ?)
        `, [
          auditId,
          item.product_id,
          id,
          item.quantity,
          product.physical_quantity,
          product.physical_quantity, // physical stock unchanged
          prevReserved,
          newReserved,
          req.user.id
        ]);
      }

      // 3. Mark Sales Order as CONFIRMED
      await dbClient.run(`
        UPDATE sales_orders
        SET status = 'CONFIRMED', confirmed_by = ?, confirmed_at = datetime('now')
        WHERE id = ?
      `, [req.user.id, id]);
    });

    const updated = await get(`
      SELECT so.*, u_conf.name AS confirmed_by_name
      FROM sales_orders so
      LEFT JOIN users u_conf ON so.confirmed_by = u_conf.id
      WHERE so.id = ?
    `, [id]);

    return res.json({
      success: true,
      message: `Sales Order ${order.order_number} confirmed. Stock successfully reserved. Physical stock unchanged.`,
      data: updated
    });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
}

// ── DISPATCH SALES ORDER (ADMIN ONLY) ────────────────────────
// Decreases BOTH physical_quantity and reserved_quantity.
// Prevents invalid or duplicate dispatches.
async function dispatchSalesOrder(req, res, next) {
  try {
    const { id } = req.params;
    const { tracking_number, notes } = req.body;

    const order = await get('SELECT * FROM sales_orders WHERE id = ?', [id]);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Sales Order not found.' });
    }

    // STRICT CHECK: Prevent invalid or duplicate dispatch
    if (order.status === 'DISPATCHED') {
      return res.status(400).json({
        success: false,
        error: `Order ${order.order_number} has already been dispatched. Duplicate dispatch prevented.`
      });
    }

    if (order.status !== 'CONFIRMED') {
      return res.status(400).json({
        success: false,
        error: `Only CONFIRMED orders with reserved stock can be dispatched. Current status: ${order.status}`
      });
    }

    const items = await all('SELECT * FROM sales_order_items WHERE sales_order_id = ?', [id]);
    const trackingNo = tracking_number || `TRK-IN-${Date.now().toString().slice(-8)}`;

    // Execute in an ACID database transaction
    await withTransaction(async (dbClient) => {
      for (const item of items) {
        const product = await dbClient.get('SELECT * FROM products WHERE id = ?', [item.product_id]);
        if (!product) {
          throw new Error(`Product ${item.product_id} not found.`);
        }

        const prevPhysical = product.physical_quantity;
        const prevReserved = product.reserved_quantity;

        const newPhysical = Math.max(0, prevPhysical - item.quantity);
        const newReserved = Math.max(0, prevReserved - item.quantity);

        // Update inventory: decrease both physical and reserved
        await dbClient.run(`
          UPDATE products
          SET physical_quantity = ?, reserved_quantity = ?
          WHERE id = ?
        `, [newPhysical, newReserved, item.product_id]);

        // Record audit transaction
        const auditId = `tx-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 4)}`;
        await dbClient.run(`
          INSERT INTO inventory_transactions (
            id, product_id, sales_order_id, transaction_type, quantity,
            previous_physical, new_physical, previous_reserved, new_reserved, created_by
          ) VALUES (?, ?, ?, 'DISPATCHED', ?, ?, ?, ?, ?, ?)
        `, [
          auditId,
          item.product_id,
          id,
          item.quantity,
          prevPhysical,
          newPhysical,
          prevReserved,
          newReserved,
          req.user.id
        ]);
      }

      // Mark Sales Order as DISPATCHED
      await dbClient.run(`
        UPDATE sales_orders
        SET status = 'DISPATCHED',
            dispatched_by = ?,
            dispatched_at = datetime('now'),
            dispatch_tracking_number = ?,
            dispatch_notes = ?
        WHERE id = ?
      `, [req.user.id, trackingNo, notes || null, id]);
    });

    const updated = await get(`
      SELECT so.*, u_disp.name AS dispatched_by_name
      FROM sales_orders so
      LEFT JOIN users u_disp ON so.dispatched_by = u_disp.id
      WHERE so.id = ?
    `, [id]);

    return res.json({
      success: true,
      message: `Sales Order ${order.order_number} successfully dispatched. Physical and reserved inventory deducted.`,
      data: updated
    });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
}

module.exports = {
  listSalesOrders,
  getSalesOrder,
  confirmSalesOrder,
  dispatchSalesOrder
};

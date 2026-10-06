const { exec } = require('./db');

async function initializeSchema() {
  const schemaSQL = `
    -- 1. Users Table (ADMIN & SALES_USER)
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('ADMIN', 'SALES_USER', 'Super Admin')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 2. Customers Table
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      company TEXT NOT NULL,
      address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 3. Products & Inventory
    -- Available Stock = physical_quantity - reserved_quantity
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      sku TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      unit_price REAL NOT NULL CHECK(unit_price >= 0),
      physical_quantity INTEGER NOT NULL DEFAULT 0 CHECK(physical_quantity >= 0),
      reserved_quantity INTEGER NOT NULL DEFAULT 0 CHECK(reserved_quantity >= 0),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 4. Enquiries Table
    CREATE TABLE IF NOT EXISTS enquiries (
      id TEXT PRIMARY KEY,
      enquiry_number TEXT UNIQUE NOT NULL,
      customer_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'NEW' CHECK(status IN ('NEW', 'QUOTED', 'CLOSED')),
      notes TEXT,
      created_by TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT,
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    -- 5. Enquiry Items (Multiple products per enquiry)
    CREATE TABLE IF NOT EXISTS enquiry_items (
      id TEXT PRIMARY KEY,
      enquiry_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      quantity INTEGER NOT NULL CHECK(quantity > 0),
      target_price REAL,
      notes TEXT,
      FOREIGN KEY (enquiry_id) REFERENCES enquiries(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
    );

    -- 6. Quotations Table
    CREATE TABLE IF NOT EXISTS quotations (
      id TEXT PRIMARY KEY,
      quotation_number TEXT UNIQUE NOT NULL,
      enquiry_id TEXT NOT NULL,
      customer_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'DRAFT' CHECK(status IN ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'ORDERED')),
      subtotal REAL NOT NULL DEFAULT 0.00,
      discount_pct REAL NOT NULL DEFAULT 0.00 CHECK(discount_pct >= 0 AND discount_pct <= 100),
      discount_amount REAL NOT NULL DEFAULT 0.00,
      gst_rate_pct REAL NOT NULL DEFAULT 18.00,
      gst_amount REAL NOT NULL DEFAULT 0.00,
      total_amount REAL NOT NULL DEFAULT 0.00,
      valid_until DATE,
      created_by TEXT NOT NULL,
      sent_at DATETIME,
      decision_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (enquiry_id) REFERENCES enquiries(id) ON DELETE RESTRICT,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT,
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    -- 7. Quotation Items
    CREATE TABLE IF NOT EXISTS quotation_items (
      id TEXT PRIMARY KEY,
      quotation_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      quantity INTEGER NOT NULL CHECK(quantity > 0),
      unit_price REAL NOT NULL CHECK(unit_price >= 0),
      line_total REAL NOT NULL,
      FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
    );

    -- 8. Sales Orders Table (Only created from ACCEPTED quotations)
    CREATE TABLE IF NOT EXISTS sales_orders (
      id TEXT PRIMARY KEY,
      order_number TEXT UNIQUE NOT NULL,
      quotation_id TEXT UNIQUE NOT NULL,
      enquiry_id TEXT NOT NULL,
      customer_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'CONFIRMED', 'DISPATCHED', 'CANCELLED')),
      total_amount REAL NOT NULL,
      confirmed_by TEXT,
      confirmed_at DATETIME,
      dispatched_by TEXT,
      dispatched_at DATETIME,
      dispatch_tracking_number TEXT,
      dispatch_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE RESTRICT,
      FOREIGN KEY (enquiry_id) REFERENCES enquiries(id) ON DELETE RESTRICT,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT,
      FOREIGN KEY (confirmed_by) REFERENCES users(id),
      FOREIGN KEY (dispatched_by) REFERENCES users(id)
    );

    -- 9. Sales Order Items
    CREATE TABLE IF NOT EXISTS sales_order_items (
      id TEXT PRIMARY KEY,
      sales_order_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      quantity INTEGER NOT NULL CHECK(quantity > 0),
      unit_price REAL NOT NULL,
      line_total REAL NOT NULL,
      FOREIGN KEY (sales_order_id) REFERENCES sales_orders(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
    );

    -- 10. Inventory Audit / Transactions Log
    CREATE TABLE IF NOT EXISTS inventory_transactions (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      sales_order_id TEXT,
      transaction_type TEXT NOT NULL CHECK(transaction_type IN ('RESERVED', 'DISPATCHED', 'RESTOCKED', 'RELEASED')),
      quantity INTEGER NOT NULL,
      previous_physical INTEGER NOT NULL,
      new_physical INTEGER NOT NULL,
      previous_reserved INTEGER NOT NULL,
      new_reserved INTEGER NOT NULL,
      created_by TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
      FOREIGN KEY (sales_order_id) REFERENCES sales_orders(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_enq_cust ON enquiries(customer_id);
    CREATE INDEX IF NOT EXISTS idx_quo_enq ON quotations(enquiry_id);
    CREATE INDEX IF NOT EXISTS idx_so_quo ON sales_orders(quotation_id);
    CREATE INDEX IF NOT EXISTS idx_prod_sku ON products(sku);
  `;

  await exec(schemaSQL);
  console.log('[Schema] Case study relational schema initialized successfully.');
}

module.exports = {
  initializeSchema
};

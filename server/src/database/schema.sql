-- ============================================================
-- PERN Full-Stack Technical Case Study: Relational Database Schema
-- Focus: Enquiry -> Quotation -> Sales Order -> Inventory -> Dispatch
-- ============================================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(32) NOT NULL CHECK (role IN ('ADMIN', 'SALES_USER')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Customers Table
CREATE TABLE IF NOT EXISTS customers (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(64),
  company VARCHAR(255) NOT NULL,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Products & Inventory Table
-- Available Stock = physical_quantity - reserved_quantity
CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(64) PRIMARY KEY,
  sku VARCHAR(64) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
  physical_quantity INTEGER NOT NULL DEFAULT 0 CHECK (physical_quantity >= 0),
  reserved_quantity INTEGER NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_reserved_lte_physical CHECK (reserved_quantity <= physical_quantity)
);

-- 4. Enquiries Table
CREATE TABLE IF NOT EXISTS enquiries (
  id VARCHAR(64) PRIMARY KEY,
  enquiry_number VARCHAR(64) UNIQUE NOT NULL,
  customer_id VARCHAR(64) NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  status VARCHAR(32) NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW', 'QUOTED', 'CLOSED')),
  notes TEXT,
  created_by VARCHAR(64) NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Enquiry Items (Multiple products per enquiry)
CREATE TABLE IF NOT EXISTS enquiry_items (
  id VARCHAR(64) PRIMARY KEY,
  enquiry_id VARCHAR(64) NOT NULL REFERENCES enquiries(id) ON DELETE CASCADE,
  product_id VARCHAR(64) NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  target_price NUMERIC(12, 2),
  notes TEXT
);

-- 6. Quotations Table
CREATE TABLE IF NOT EXISTS quotations (
  id VARCHAR(64) PRIMARY KEY,
  quotation_number VARCHAR(64) UNIQUE NOT NULL,
  enquiry_id VARCHAR(64) NOT NULL REFERENCES enquiries(id) ON DELETE RESTRICT,
  customer_id VARCHAR(64) NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  status VARCHAR(32) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'ORDERED')),
  subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  discount_pct NUMERIC(5, 2) NOT NULL DEFAULT 0.00 CHECK (discount_pct >= 0 AND discount_pct <= 100),
  discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  gst_rate_pct NUMERIC(5, 2) NOT NULL DEFAULT 18.00,
  gst_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  valid_until DATE,
  created_by VARCHAR(64) NOT NULL REFERENCES users(id),
  sent_at TIMESTAMP WITH TIME ZONE,
  decision_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Quotation Items
CREATE TABLE IF NOT EXISTS quotation_items (
  id VARCHAR(64) PRIMARY KEY,
  quotation_id VARCHAR(64) NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  product_id VARCHAR(64) NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
  line_total NUMERIC(12, 2) NOT NULL
);

-- 8. Sales Orders Table
-- Created only from ACCEPTED quotations
CREATE TABLE IF NOT EXISTS sales_orders (
  id VARCHAR(64) PRIMARY KEY,
  order_number VARCHAR(64) UNIQUE NOT NULL,
  quotation_id VARCHAR(64) UNIQUE NOT NULL REFERENCES quotations(id) ON DELETE RESTRICT,
  enquiry_id VARCHAR(64) NOT NULL REFERENCES enquiries(id) ON DELETE RESTRICT,
  customer_id VARCHAR(64) NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  status VARCHAR(32) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'DISPATCHED', 'CANCELLED')),
  total_amount NUMERIC(12, 2) NOT NULL,
  confirmed_by VARCHAR(64) REFERENCES users(id),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  dispatched_by VARCHAR(64) REFERENCES users(id),
  dispatched_at TIMESTAMP WITH TIME ZONE,
  dispatch_tracking_number VARCHAR(128),
  dispatch_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Sales Order Items
CREATE TABLE IF NOT EXISTS sales_order_items (
  id VARCHAR(64) PRIMARY KEY,
  sales_order_id VARCHAR(64) NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
  product_id VARCHAR(64) NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(12, 2) NOT NULL,
  line_total NUMERIC(12, 2) NOT NULL
);

-- 10. Inventory Audit / Transaction Log
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id VARCHAR(64) PRIMARY KEY,
  product_id VARCHAR(64) NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  sales_order_id VARCHAR(64) REFERENCES sales_orders(id) ON DELETE CASCADE,
  transaction_type VARCHAR(32) NOT NULL CHECK (transaction_type IN ('RESERVED', 'DISPATCHED', 'RESTOCKED', 'RELEASED')),
  quantity INTEGER NOT NULL,
  previous_physical INTEGER NOT NULL,
  new_physical INTEGER NOT NULL,
  previous_reserved INTEGER NOT NULL,
  new_reserved INTEGER NOT NULL,
  created_by VARCHAR(64) NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_enquiries_customer ON enquiries(customer_id);
CREATE INDEX IF NOT EXISTS idx_quotations_enquiry ON quotations(enquiry_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_quotation ON sales_orders(quotation_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);

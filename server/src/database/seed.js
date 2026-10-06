const bcrypt = require('bcryptjs');
const { get, run, all } = require('./db');

async function seedDatabase() {
  const existingUser = await get('SELECT id FROM users LIMIT 1');
  if (existingUser) {
    return;
  }

  console.log('[Seed] Seeding PERN Technical Case Study initial dataset...');

  // 1. Users (ADMIN and SALES_USER)
  const adminPass = await bcrypt.hash('Admin@123', 10);
  const salesPass = await bcrypt.hash('Sales@123', 10);

  await run(`
    INSERT INTO users (id, email, password_hash, name, role) VALUES
    ('usr-admin-01', 'admin@thesource.com', ?, 'System Administrator', 'ADMIN'),
    ('usr-sales-01', 'sales@thesource.com', ?, 'Senior Sales Executive', 'SALES_USER'),
    ('usr-admin-02', 'admin@pern.com', ?, 'Case Study Admin', 'ADMIN')
  `, [adminPass, salesPass, adminPass]);

  // 2. Customers
  await run(`
    INSERT INTO customers (id, name, email, phone, company, address) VALUES
    ('cust-01', 'Vikram Malhotra', 'procurement@tatapower.com', '+91 98200 11223', 'Tata Power Renewables', 'Tech Park, Whitefield, Bengaluru'),
    ('cust-02', 'Ananya Sharma', 'projects@adanienergy.com', '+91 98111 44556', 'Adani Green Infrastructure', 'Adani Shantigram, SG Highway, Ahmedabad'),
    ('cust-03', 'Rajesh Kulkarni', 'energy@reliance.com', '+91 98450 77889', 'Reliance Clean Energy Solutions', 'Reliance Corporate Park, Navi Mumbai')
  `);

  // 3. Products & Initial Inventory
  // Available Stock = physical_quantity - reserved_quantity
  await run(`
    INSERT INTO products (id, sku, name, description, unit_price, physical_quantity, reserved_quantity) VALUES
    ('prd-01', 'PRD-TURB-X1', 'Airborne Wind Turbine X1 (12 kW)', 'Tethered aerostat airborne wind energy system with dual counter-rotating rotors', 450000.00, 10, 2),
    ('prd-02', 'PRD-TETH-300M', 'High-Tension Conductive Tether (300m)', 'Ultra-high molecular weight polyethylene tether with integrated copper conductor core', 85000.00, 25, 4),
    ('prd-03', 'PRD-WNCH-50KN', 'Smart Automated Winch Station 50kN', 'High-torque ground winch station with regenerative braking and automated tension control', 220000.00, 8, 1),
    ('prd-04', 'PRD-INV-15KW', 'Bidirectional Grid Inverter 15kW', 'Three-phase grid synchronizing power converter with 98.6% peak efficiency', 110000.00, 30, 4),
    ('prd-05', 'PRD-BATT-20KWH', 'LFP Energy Storage Module 20kWh', 'Solid-state battery buffer system with thermal management and CAN bus BMS', 340000.00, 15, 2)
  `);

  // 4. Sample Enquiries
  await run(`
    INSERT INTO enquiries (id, enquiry_number, customer_id, status, notes, created_by) VALUES
    ('enq-01', 'ENQ-2026-001', 'cust-01', 'QUOTED', 'Urgent enquiry for 2 units of Airborne Turbine X1 and tether system for desert testing site', 'usr-sales-01'),
    ('enq-02', 'ENQ-2026-002', 'cust-02', 'QUOTED', 'Commercial microgrid proposal with full battery storage and inverter package', 'usr-sales-01'),
    ('enq-03', 'ENQ-2026-003', 'cust-03', 'NEW', 'Initial feasibility enquiry for 5 wind units in coastal facility', 'usr-sales-01')
  `);

  await run(`
    INSERT INTO enquiry_items (id, enquiry_id, product_id, quantity, target_price, notes) VALUES
    ('ei-01', 'enq-01', 'prd-01', 2, 440000.00, 'Requires standard delivery'),
    ('ei-02', 'enq-01', 'prd-02', 2, 80000.00, '300m length per unit'),
    ('ei-03', 'enq-02', 'prd-04', 2, 105000.00, 'Grid tie compliant'),
    ('ei-04', 'enq-02', 'prd-05', 2, 330000.00, 'Outdoor rated enclosure'),
    ('ei-05', 'enq-03', 'prd-01', 5, 430000.00, 'Volume discount expected')
  `);

  // 5. Sample Quotations
  // Quotation 1 (Accepted -> will have sample Sales Order)
  // Subtotal: (2 * 450000) + (2 * 85000) = 900000 + 170000 = 1070000
  // Discount: 5% = 53500 => Taxable: 1016500
  // GST 18%: 182970 => Total: 1199470
  await run(`
    INSERT INTO quotations (
      id, quotation_number, enquiry_id, customer_id, status, subtotal, discount_pct, discount_amount, gst_rate_pct, gst_amount, total_amount, valid_until, created_by, sent_at, decision_at
    ) VALUES (
      'quo-01', 'QUO-2026-001', 'enq-01', 'cust-01', 'ACCEPTED', 1070000.00, 5.00, 53500.00, 18.00, 182970.00, 1199470.00, '2026-11-30', 'usr-sales-01', datetime('now', '-3 days'), datetime('now', '-2 days')
    )
  `);

  await run(`
    INSERT INTO quotation_items (id, quotation_id, product_id, quantity, unit_price, line_total) VALUES
    ('qi-01', 'quo-01', 'prd-01', 2, 450000.00, 900000.00),
    ('qi-02', 'quo-01', 'prd-02', 2, 85000.00, 170000.00)
  `);

  // Quotation 2 (Sent, awaiting customer response)
  // Subtotal: (2 * 110000) + (2 * 340000) = 220000 + 680000 = 900000
  // Discount 0%, GST 18%: 162000 => Total: 1062000
  await run(`
    INSERT INTO quotations (
      id, quotation_number, enquiry_id, customer_id, status, subtotal, discount_pct, discount_amount, gst_rate_pct, gst_amount, total_amount, valid_until, created_by, sent_at
    ) VALUES (
      'quo-02', 'QUO-2026-002', 'enq-02', 'cust-02', 'SENT', 900000.00, 0.00, 0.00, 18.00, 162000.00, 1062000.00, '2026-12-15', 'usr-sales-01', datetime('now', '-1 day')
    )
  `);

  await run(`
    INSERT INTO quotation_items (id, quotation_id, product_id, quantity, unit_price, line_total) VALUES
    ('qi-03', 'quo-02', 'prd-04', 2, 110000.00, 220000.00),
    ('qi-04', 'quo-02', 'prd-05', 2, 340000.00, 680000.00)
  `);

  // 6. Sample Sales Order from Accepted Quotation (quo-01)
  await run(`
    INSERT INTO sales_orders (
      id, order_number, quotation_id, enquiry_id, customer_id, status, total_amount, confirmed_by, confirmed_at
    ) VALUES (
      'so-01', 'SO-2026-001', 'quo-01', 'enq-01', 'cust-01', 'CONFIRMED', 1199470.00, 'usr-admin-01', datetime('now', '-1 day')
    )
  `);

  await run(`
    INSERT INTO sales_order_items (id, sales_order_id, product_id, quantity, unit_price, line_total) VALUES
    ('soi-01', 'so-01', 'prd-01', 2, 450000.00, 900000.00),
    ('soi-02', 'so-01', 'prd-02', 2, 85000.00, 170000.00)
  `);

  console.log('[Seed] Database seeded successfully with Enquiries, Quotations, Orders, and Stock!');
}

module.exports = { seedDatabase };

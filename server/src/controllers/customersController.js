const { get, all, run } = require('../database/db');

async function listCustomers(req, res, next) {
  try {
    const customers = await all('SELECT * FROM customers ORDER BY name ASC');
    return res.json({ success: true, count: customers.length, data: customers });
  } catch (err) {
    next(err);
  }
}

async function createCustomer(req, res, next) {
  try {
    const { name, email, phone, company, address } = req.body;
    if (!name || !email || !company) {
      return res.status(400).json({ success: false, error: 'Name, email, and company are required.' });
    }
    const id = `cust-${Date.now().toString(36)}`;
    await run(`
      INSERT INTO customers (id, name, email, phone, company, address)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [id, name.trim(), email.trim(), phone || null, company.trim(), address || null]);

    const created = await get('SELECT * FROM customers WHERE id = ?', [id]);
    return res.status(201).json({ success: true, data: created });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listCustomers,
  createCustomer
};

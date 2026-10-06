const bcrypt = require('bcryptjs');
const { run, all } = require('./db');

async function addCustomerUsers() {
  const hash = await bcrypt.hash('Customer@Source2026!', 10);
  
  await run(`
    INSERT OR REPLACE INTO users (id, email, password_hash, name, role)
    VALUES ('usr-cust-01', 'customer@thesource-company.in', ?, 'Site Stakeholder (Customer)', 'SALES_USER')
  `, [hash]);

  await run(`
    INSERT OR REPLACE INTO users (id, email, password_hash, name, role)
    VALUES ('usr-cust-02', 'customer@thesource.com', ?, 'Site Stakeholder (Customer)', 'SALES_USER')
  `, [hash]);

  const users = await all('SELECT id, email, name, role FROM users');
  console.log('Current users in DB:', users);
}

addCustomerUsers().catch(console.error);

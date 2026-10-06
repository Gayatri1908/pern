const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const config = require('../config');

const dbFile = path.resolve(__dirname, '../../', config.DB_PATH);
const db = new sqlite3.Database(dbFile, (err) => {
  if (err) {
    console.error('Failed to connect to SQLite database:', err.message);
  } else {
    // Enable WAL mode and foreign keys for high performance and strict relational constraints
    db.run('PRAGMA foreign_keys = ON;');
    db.run('PRAGMA journal_mode = WAL;');
  }
});

// Helper functions for async / await query handling
const get = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const all = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
};

const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

const exec = (sql) => {
  return new Promise((resolve, reject) => {
    db.exec(sql, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};

module.exports = {
  db,
  get,
  all,
  run,
  exec
};

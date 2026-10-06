const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const config = require('../config');

let pgPool = null;
const isPostgres = Boolean(process.env.DATABASE_URL);

if (isPostgres) {
  const { Pool } = require('pg');
  pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
  console.log('[DB] Connected to PostgreSQL database pool.');
}

// SQLite local instance
const dbFile = path.resolve(__dirname, '../../', config.DB_PATH || 'pern_case_study.db');
const sqliteDb = new sqlite3.Database(dbFile, (err) => {
  if (err) {
    console.error('[DB] Failed to connect to SQLite database:', err.message);
  } else {
    sqliteDb.run('PRAGMA foreign_keys = ON;');
    sqliteDb.run('PRAGMA journal_mode = WAL;');
    console.log(`[DB] Connected to local SQLite database: ${dbFile}`);
  }
});

// Helper functions for async / await query handling
const get = async (sql, params = []) => {
  if (isPostgres) {
    // Translate ? to $1, $2 for Postgres
    let pIdx = 1;
    const pgSql = sql.replace(/\?/g, () => `$${pIdx++}`);
    const res = await pgPool.query(pgSql, params);
    return res.rows[0] || null;
  }
  return new Promise((resolve, reject) => {
    sqliteDb.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row || null);
    });
  });
};

const all = async (sql, params = []) => {
  if (isPostgres) {
    let pIdx = 1;
    const pgSql = sql.replace(/\?/g, () => `$${pIdx++}`);
    const res = await pgPool.query(pgSql, params);
    return res.rows || [];
  }
  return new Promise((resolve, reject) => {
    sqliteDb.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
};

const run = async (sql, params = []) => {
  if (isPostgres) {
    let pIdx = 1;
    const pgSql = sql.replace(/\?/g, () => `$${pIdx++}`);
    const res = await pgPool.query(pgSql, params);
    return { lastID: null, changes: res.rowCount };
  }
  return new Promise((resolve, reject) => {
    sqliteDb.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

const exec = async (sql) => {
  if (isPostgres) {
    await pgPool.query(sql);
    return;
  }
  return new Promise((resolve, reject) => {
    sqliteDb.exec(sql, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};

// ACID Transaction Execution
const withTransaction = async (callback) => {
  if (isPostgres) {
    const client = await pgPool.connect();
    try {
      await client.query('BEGIN');
      const scopedDb = {
        get: async (sql, params = []) => {
          let pIdx = 1;
          const pgSql = sql.replace(/\?/g, () => `$${pIdx++}`);
          const res = await client.query(pgSql, params);
          return res.rows[0] || null;
        },
        all: async (sql, params = []) => {
          let pIdx = 1;
          const pgSql = sql.replace(/\?/g, () => `$${pIdx++}`);
          const res = await client.query(pgSql, params);
          return res.rows || [];
        },
        run: async (sql, params = []) => {
          let pIdx = 1;
          const pgSql = sql.replace(/\?/g, () => `$${pIdx++}`);
          const res = await client.query(pgSql, params);
          return { lastID: null, changes: res.rowCount };
        }
      };
      const result = await callback(scopedDb);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // SQLite transaction
  await run('BEGIN IMMEDIATE TRANSACTION');
  try {
    const scopedDb = { get, all, run };
    const result = await callback(scopedDb);
    await run('COMMIT');
    return result;
  } catch (err) {
    try { await run('ROLLBACK'); } catch (_) {}
    throw err;
  }
};

module.exports = {
  db: sqliteDb,
  pgPool,
  isPostgres,
  get,
  all,
  run,
  exec,
  withTransaction
};

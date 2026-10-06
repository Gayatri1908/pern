const bcrypt = require('bcryptjs');
const { all, get, run } = require('../database/db');

async function getUsers(req, res, next) {
  try {
    const users = await all('SELECT id, email, name, role, company, phone, created_at, last_login FROM users ORDER BY created_at DESC');
    return res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (err) {
    next(err);
  }
}

async function createUser(req, res, next) {
  try {
    const { email, password, name, role = 'Operator', company, phone } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ success: false, error: 'Email, password, and name are required.' });
    }

    if (!['Admin', 'Operator'].includes(role)) {
      return res.status(400).json({ success: false, error: "Role must be 'Admin' or 'Operator'." });
    }

    const existing = await get('SELECT id FROM users WHERE LOWER(email) = LOWER(?)', [email.trim()]);
    if (existing) {
      return res.status(409).json({ success: false, error: 'A user with this email already exists.' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const id = `usr-${Date.now()}`;

    await run(`
      INSERT INTO users (id, email, password_hash, name, role, company, phone)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [id, email.trim(), password_hash, name, role, company || 'The Source Company', phone || null]);

    const created = await get('SELECT id, email, name, role, company, phone, created_at FROM users WHERE id = ?', [id]);
    return res.status(201).json({
      success: true,
      message: 'User created successfully.',
      data: created
    });
  } catch (err) {
    next(err);
  }
}

async function getSystemConfig(req, res, next) {
  try {
    const { system_id } = req.params;
    const config = await get('SELECT * FROM system_configurations WHERE system_id = ?', [system_id]);
    if (!config) {
      return res.status(404).json({ success: false, error: `Configuration for system '${system_id}' not found.` });
    }
    return res.json({ success: true, data: config });
  } catch (err) {
    next(err);
  }
}

async function updateSystemConfig(req, res, next) {
  try {
    const { system_id } = req.params;
    const { cut_in_wind_speed, cut_out_wind_speed, max_altitude_m, max_tension_kn, max_rotor_rpm } = req.body;

    const existing = await get('SELECT * FROM system_configurations WHERE system_id = ?', [system_id]);
    if (!existing) {
      return res.status(404).json({ success: false, error: `System configuration for '${system_id}' not found.` });
    }

    await run(`
      UPDATE system_configurations
      SET cut_in_wind_speed = ?, cut_out_wind_speed = ?, max_altitude_m = ?, max_tension_kn = ?, max_rotor_rpm = ?, updated_at = datetime('now')
      WHERE system_id = ?
    `, [
      cut_in_wind_speed !== undefined ? cut_in_wind_speed : existing.cut_in_wind_speed,
      cut_out_wind_speed !== undefined ? cut_out_wind_speed : existing.cut_out_wind_speed,
      max_altitude_m !== undefined ? max_altitude_m : existing.max_altitude_m,
      max_tension_kn !== undefined ? max_tension_kn : existing.max_tension_kn,
      max_rotor_rpm !== undefined ? max_rotor_rpm : existing.max_rotor_rpm,
      system_id
    ]);

    // Record audit event
    await run(`
      INSERT INTO events (system_id, event_type, event_source, severity, description)
      VALUES (?, 'CONFIG_CHANGE', 'Admin Console', 'WARNING', ?)
    `, [system_id, `Operating envelope thresholds modified by Admin ${req.user.name}`]);

    const updated = await get('SELECT * FROM system_configurations WHERE system_id = ?', [system_id]);
    return res.json({
      success: true,
      message: 'System configuration envelope updated successfully.',
      data: updated
    });
  } catch (err) {
    next(err);
  }
}

async function getAuditLogs(req, res, next) {
  try {
    const logs = await all('SELECT * FROM events ORDER BY created_at DESC LIMIT 100');
    return res.json({ success: true, count: logs.length, data: logs });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getUsers,
  createUser,
  getSystemConfig,
  updateSystemConfig,
  getAuditLogs
};

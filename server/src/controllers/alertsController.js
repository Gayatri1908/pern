const { all, get, run } = require('../database/db');

async function getAlerts(req, res, next) {
  try {
    const { status, severity, system_id, search } = req.query;
    let sql = `
      SELECT a.*, s.system_name, s.model, s.location
      FROM alerts a
      LEFT JOIN energy_systems s ON a.system_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'ALL') {
      sql += ' AND a.status = ?';
      params.push(status);
    }

    if (severity && severity !== 'ALL') {
      sql += ' AND a.severity = ?';
      params.push(severity);
    }

    if (system_id && system_id !== 'ALL') {
      sql += ' AND a.system_id = ?';
      params.push(system_id);
    }

    if (search) {
      sql += ' AND (a.title LIKE ? OR a.description LIKE ? OR a.alert_type LIKE ? OR a.system_id LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    sql += ' ORDER BY CASE a.severity WHEN "CRITICAL" THEN 1 WHEN "WARNING" THEN 2 ELSE 3 END, a.triggered_at DESC';

    const alerts = await all(sql, params);
    return res.json({
      success: true,
      count: alerts.length,
      data: alerts
    });
  } catch (err) {
    next(err);
  }
}

async function acknowledgeAlert(req, res, next) {
  try {
    const { id } = req.params;
    const alert = await get('SELECT * FROM alerts WHERE id = ?', [id]);
    if (!alert) {
      return res.status(404).json({ success: false, error: `Alert '${id}' not found.` });
    }

    if (alert.status === 'ACKNOWLEDGED') {
      return res.status(400).json({ success: false, error: 'Alert is already acknowledged.' });
    }

    const operatorName = req.user ? req.user.name : 'Operational Engineer';

    await run(`
      UPDATE alerts
      SET status = 'ACKNOWLEDGED', acknowledged_at = datetime('now'), acknowledged_by = ?
      WHERE id = ?
    `, [operatorName, id]);

    // Record audit event
    await run(`
      INSERT INTO events (system_id, event_type, event_source, severity, description)
      VALUES (?, 'ALERT_ACKNOWLEDGED', 'Operator Action', 'INFO', ?)
    `, [alert.system_id, `Alert '${alert.title}' acknowledged by ${operatorName}.`]);

    const updated = await get('SELECT * FROM alerts WHERE id = ?', [id]);
    return res.json({
      success: true,
      message: `Alert '${id}' acknowledged successfully.`,
      data: updated
    });
  } catch (err) {
    next(err);
  }
}

async function resolveAlert(req, res, next) {
  try {
    const { id } = req.params;
    const { resolution_notes } = req.body;

    const alert = await get('SELECT * FROM alerts WHERE id = ?', [id]);
    if (!alert) {
      return res.status(404).json({ success: false, error: `Alert '${id}' not found.` });
    }

    const resolverName = req.user ? req.user.name : 'Lead Engineer';

    await run(`
      UPDATE alerts
      SET status = 'RESOLVED', resolved_at = datetime('now'), resolved_by = ?
      WHERE id = ?
    `, [resolverName, id]);

    // Update active_alerts_count on the system
    await run(`
      UPDATE energy_systems
      SET active_alerts_count = (SELECT COUNT(*) FROM alerts WHERE system_id = ? AND status != 'RESOLVED')
      WHERE id = ?
    `, [alert.system_id, alert.system_id]);

    // Record audit event
    await run(`
      INSERT INTO events (system_id, event_type, event_source, severity, description)
      VALUES (?, 'ALERT_RESOLVED', 'Operator Action', 'INFO', ?)
    `, [alert.system_id, `Alert '${alert.title}' marked as RESOLVED by ${resolverName}. Notes: ${resolution_notes || 'None'}`]);

    const updated = await get('SELECT * FROM alerts WHERE id = ?', [id]);
    return res.json({
      success: true,
      message: `Alert '${id}' marked as resolved.`,
      data: updated
    });
  } catch (err) {
    next(err);
  }
}

async function createAlert(req, res, next) {
  try {
    const { system_id, alert_type, severity, title, description, threshold_breached } = req.body;
    if (!system_id || !alert_type || !severity || !title || !description) {
      return res.status(400).json({ success: false, error: 'Missing required alert fields.' });
    }

    const id = `ALT-${Date.now()}`;
    await run(`
      INSERT INTO alerts (id, system_id, alert_type, severity, status, title, description, threshold_breached, triggered_at)
      VALUES (?, ?, ?, ?, 'ACTIVE', ?, ?, ?, datetime('now'))
    `, [id, system_id, alert_type, severity, title, description, threshold_breached || null]);

    // Update active_alerts_count
    await run(`
      UPDATE energy_systems
      SET active_alerts_count = active_alerts_count + 1
      WHERE id = ?
    `, [system_id]);

    const newAlert = await get('SELECT * FROM alerts WHERE id = ?', [id]);
    return res.status(201).json({
      success: true,
      data: newAlert
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAlerts,
  acknowledgeAlert,
  resolveAlert,
  createAlert
};

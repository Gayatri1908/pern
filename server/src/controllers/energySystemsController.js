const { all, get, run } = require('../database/db');

async function getEnergySystems(req, res, next) {
  try {
    const { status, model, search } = req.query;
    let sql = 'SELECT * FROM energy_systems WHERE 1=1';
    const params = [];

    if (status && status !== 'ALL') {
      sql += ' AND status = ?';
      params.push(status);
    }

    if (model && model !== 'ALL') {
      sql += ' AND model = ?';
      params.push(model);
    }

    if (search) {
      sql += ' AND (system_name LIKE ? OR model LIKE ? OR location LIKE ? OR serial_number LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    sql += ' ORDER BY rated_power_kw DESC';

    const systems = await all(sql, params);
    return res.json({
      success: true,
      count: systems.length,
      data: systems
    });
  } catch (err) {
    next(err);
  }
}

async function getEnergySystemById(req, res, next) {
  try {
    const { id } = req.params;
    const system = await get('SELECT * FROM energy_systems WHERE id = ?', [id]);
    if (!system) {
      return res.status(404).json({
        success: false,
        error: `Energy system with ID '${id}' was not found.`
      });
    }

    // Include system configuration, components count, and active alerts
    const config = await get('SELECT * FROM system_configurations WHERE system_id = ?', [id]);
    const components = await all('SELECT * FROM system_components WHERE system_id = ? ORDER BY component_type', [id]);
    const alerts = await all('SELECT * FROM alerts WHERE system_id = ? AND status != "RESOLVED" ORDER BY triggered_at DESC', [id]);
    const latestTelemetry = await get('SELECT * FROM telemetry WHERE system_id = ? ORDER BY timestamp DESC LIMIT 1', [id]);
    const latestHealth = await get('SELECT * FROM system_health WHERE system_id = ? ORDER BY timestamp DESC LIMIT 1', [id]);

    return res.json({
      success: true,
      data: {
        ...system,
        configuration: config || null,
        components: components || [],
        active_alerts: alerts || [],
        latest_telemetry: latestTelemetry || null,
        health_assessment: latestHealth || null
      }
    });
  } catch (err) {
    next(err);
  }
}

async function updateEnergySystem(req, res, next) {
  try {
    const { id } = req.params;
    const { system_name, location, status, health_status } = req.body;

    const existing = await get('SELECT * FROM energy_systems WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: `Energy system '${id}' not found.`
      });
    }

    const newName = system_name !== undefined ? system_name : existing.system_name;
    const newLocation = location !== undefined ? location : existing.location;
    const newStatus = status !== undefined ? status : existing.status;
    const newHealth = health_status !== undefined ? health_status : existing.health_status;

    await run(`
      UPDATE energy_systems
      SET system_name = ?, location = ?, status = ?, health_status = ?
      WHERE id = ?
    `, [newName, newLocation, newStatus, newHealth, id]);

    // Record operational event
    await run(`
      INSERT INTO events (system_id, event_type, event_source, severity, description)
      VALUES (?, 'SYSTEM_UPDATE', 'Operator/Admin Action', 'INFO', ?)
    `, [id, `System parameters updated. Status: ${newStatus}, Health: ${newHealth} by ${req.user.name}`]);

    const updated = await get('SELECT * FROM energy_systems WHERE id = ?', [id]);
    return res.json({
      success: true,
      message: 'Energy system updated successfully.',
      data: updated
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getEnergySystems,
  getEnergySystemById,
  updateEnergySystem
};

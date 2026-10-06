const { all, get, run } = require('../database/db');

async function getSystemTelemetry(req, res, next) {
  try {
    const { id } = req.params;
    const { range = '24h', metric, limit = 100 } = req.query;

    const system = await get('SELECT id, system_name, rated_power_kw FROM energy_systems WHERE id = ?', [id]);
    if (!system) {
      return res.status(404).json({ success: false, error: `System '${id}' not found.` });
    }

    let timeFilter;
    switch (range) {
      case '1h':
        timeFilter = "datetime('now', '-1 hour')";
        break;
      case '24h':
        timeFilter = "datetime('now', '-24 hours')";
        break;
      case '7d':
        timeFilter = "datetime('now', '-7 days')";
        break;
      case '30d':
        timeFilter = "datetime('now', '-30 days')";
        break;
      default:
        timeFilter = "datetime('now', '-24 hours')";
    }

    const sql = `
      SELECT id, system_id, timestamp, power_output_kw, voltage_v, current_a,
             wind_speed_ms, wind_direction_deg, tether_tension_kn, rotor_rpm,
             flight_altitude_m, temperature_c, battery_soc_pct, system_load_pct, efficiency_pct
      FROM telemetry
      WHERE system_id = ? AND timestamp >= ${timeFilter}
      ORDER BY timestamp ASC
      LIMIT ?
    `;

    const records = await all(sql, [id, parseInt(limit, 10)]);

    // Compute basic telemetry statistics for operational clarity
    let stats = null;
    if (records.length > 0) {
      const powers = records.map(r => r.power_output_kw);
      const winds = records.map(r => r.wind_speed_ms);
      const tensions = records.map(r => r.tether_tension_kn);

      stats = {
        data_points: records.length,
        power: {
          current: records[records.length - 1].power_output_kw,
          min: Math.min(...powers),
          max: Math.max(...powers),
          avg: Number((powers.reduce((a, b) => a + b, 0) / powers.length).toFixed(2))
        },
        wind: {
          current: records[records.length - 1].wind_speed_ms,
          min: Math.min(...winds),
          max: Math.max(...winds),
          avg: Number((winds.reduce((a, b) => a + b, 0) / winds.length).toFixed(1))
        },
        tether_tension: {
          current: records[records.length - 1].tether_tension_kn,
          min: Math.min(...tensions),
          max: Math.max(...tensions),
          avg: Number((tensions.reduce((a, b) => a + b, 0) / tensions.length).toFixed(1))
        }
      };
    }

    return res.json({
      success: true,
      system_id: id,
      system_name: system.system_name,
      range,
      metric: metric || 'all',
      stats,
      data: records
    });
  } catch (err) {
    next(err);
  }
}

async function getAllTelemetry(req, res, next) {
  try {
    const { system_id, limit = 50 } = req.query;
    let sql = 'SELECT * FROM telemetry';
    const params = [];

    if (system_id) {
      sql += ' WHERE system_id = ?';
      params.push(system_id);
    }

    sql += ' ORDER BY timestamp DESC LIMIT ?';
    params.push(parseInt(limit, 10));

    const records = await all(sql, params);
    return res.json({
      success: true,
      count: records.length,
      data: records
    });
  } catch (err) {
    next(err);
  }
}

async function recordTelemetry(req, res, next) {
  try {
    const {
      system_id,
      power_output_kw,
      voltage_v,
      current_a,
      wind_speed_ms,
      wind_direction_deg = 180,
      tether_tension_kn = 15,
      rotor_rpm = 600,
      flight_altitude_m = 250,
      temperature_c = 25,
      battery_soc_pct = 90,
      system_load_pct = 70,
      efficiency_pct = 42
    } = req.body;

    // Strict validation
    if (!system_id) {
      return res.status(400).json({ success: false, error: 'system_id is required.' });
    }

    const system = await get('SELECT id, rated_power_kw FROM energy_systems WHERE id = ?', [system_id]);
    if (!system) {
      return res.status(404).json({ success: false, error: `System '${system_id}' does not exist.` });
    }

    if (typeof power_output_kw !== 'number' || power_output_kw < 0 || power_output_kw > system.rated_power_kw * 1.5) {
      return res.status(400).json({
        success: false,
        error: `Invalid power_output_kw: must be between 0 and ${system.rated_power_kw * 1.5} kW.`
      });
    }

    if (typeof wind_speed_ms !== 'number' || wind_speed_ms < 0 || wind_speed_ms > 60) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wind_speed_ms: must be between 0 and 60 m/s.'
      });
    }

    if (typeof tether_tension_kn !== 'number' || tether_tension_kn < 0 || tether_tension_kn > 100) {
      return res.status(400).json({
        success: false,
        error: 'Invalid tether_tension_kn: must be between 0 and 100 kN.'
      });
    }

    const result = await run(`
      INSERT INTO telemetry (
        system_id, power_output_kw, voltage_v, current_a, wind_speed_ms,
        wind_direction_deg, tether_tension_kn, rotor_rpm, flight_altitude_m,
        temperature_c, battery_soc_pct, system_load_pct, efficiency_pct
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      system_id, power_output_kw, voltage_v || 400.0, current_a || (power_output_kw * 1000 / 400.0),
      wind_speed_ms, wind_direction_deg, tether_tension_kn, rotor_rpm, flight_altitude_m,
      temperature_c, battery_soc_pct, system_load_pct, efficiency_pct
    ]);

    // Also update current_power_kw and last_telemetry_at in energy_systems
    await run(`
      UPDATE energy_systems
      SET current_power_kw = ?, last_telemetry_at = datetime('now')
      WHERE id = ?
    `, [power_output_kw, system_id]);

    return res.status(201).json({
      success: true,
      message: 'Telemetry recorded successfully.',
      telemetry_id: result.lastID
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getSystemTelemetry,
  getAllTelemetry,
  recordTelemetry
};

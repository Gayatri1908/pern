const { all, get } = require('../database/db');

async function getSystemHealth(req, res, next) {
  try {
    const { id } = req.params;
    const system = await get('SELECT * FROM energy_systems WHERE id = ?', [id]);
    if (!system) {
      return res.status(404).json({ success: false, error: `System '${id}' not found.` });
    }

    const latestDiagnostic = await get(`
      SELECT * FROM system_health
      WHERE system_id = ?
      ORDER BY timestamp DESC
      LIMIT 1
    `, [id]);

    const components = await all(`
      SELECT * FROM system_components
      WHERE system_id = ?
      ORDER BY health_score ASC
    `, [id]);

    // Construct hierarchy: System -> Subsystems -> Components
    const subsystems = [
      {
        subsystem_name: 'Aerodynamic Kite & Airframe',
        score: latestDiagnostic ? latestDiagnostic.aerodynamics_score : 95,
        status: (latestDiagnostic && latestDiagnostic.aerodynamics_score < 70) ? 'WARNING' : 'NORMAL',
        components: components.filter(c => c.component_type === 'Mechanical' && c.component_name.includes('Tether'))
      },
      {
        subsystem_name: 'Ground Tether & Winch System',
        score: latestDiagnostic ? latestDiagnostic.tether_winch_score : 92,
        status: (latestDiagnostic && latestDiagnostic.tether_winch_score < 70) ? (latestDiagnostic.tether_winch_score < 50 ? 'CRITICAL' : 'WARNING') : 'NORMAL',
        components: components.filter(c => c.component_name.includes('Winch'))
      },
      {
        subsystem_name: 'Permanent Magnet Generator Unit',
        score: latestDiagnostic ? latestDiagnostic.generator_score : 98,
        status: (latestDiagnostic && latestDiagnostic.generator_score < 70) ? 'WARNING' : 'NORMAL',
        components: components.filter(c => c.component_type === 'Generator')
      },
      {
        subsystem_name: 'Power Electronics & Grid Synchronizer',
        score: latestDiagnostic ? latestDiagnostic.power_electronics_score : 96,
        status: (latestDiagnostic && latestDiagnostic.power_electronics_score < 70) ? 'WARNING' : 'NORMAL',
        components: components.filter(c => c.component_type === 'Power Electronics')
      },
      {
        subsystem_name: 'Ground Energy Storage Buffer (LiFePO4)',
        score: latestDiagnostic ? latestDiagnostic.storage_score : 97,
        status: 'NORMAL',
        components: components.filter(c => c.component_type === 'Energy Storage')
      },
      {
        subsystem_name: 'Autopilot Avionics & Sensor Array',
        score: latestDiagnostic ? latestDiagnostic.control_avionics_score : 99,
        status: 'NORMAL',
        components: components.filter(c => c.component_type === 'Control System' || c.component_type === 'Sensors' || c.component_type === 'Communication')
      }
    ];

    const activeAlerts = await all(`
      SELECT id, severity, title, triggered_at FROM alerts
      WHERE system_id = ? AND status != 'RESOLVED'
    `, [id]);

    return res.json({
      success: true,
      system_id: id,
      system_name: system.system_name,
      overall_health_score: latestDiagnostic ? latestDiagnostic.overall_health_score : 94,
      severity_level: system.status === 'FAULT' ? 'CRITICAL' : (system.status === 'MAINTENANCE' ? 'WARNING' : (system.status === 'OFFLINE' ? 'OFFLINE' : 'NORMAL')),
      diagnostic_timestamp: latestDiagnostic ? latestDiagnostic.timestamp : new Date().toISOString(),
      fault_count: latestDiagnostic ? latestDiagnostic.fault_count : 0,
      warning_count: latestDiagnostic ? latestDiagnostic.warning_count : 0,
      active_warnings: activeAlerts,
      subsystems,
      components
    });
  } catch (err) {
    next(err);
  }
}

async function getAllSystemsHealth(req, res, next) {
  try {
    const systems = await all(`
      SELECT s.id, s.system_name, s.model, s.status, s.health_status,
             h.overall_health_score, h.fault_count, h.warning_count, h.timestamp as diagnostic_at
      FROM energy_systems s
      LEFT JOIN system_health h ON h.id = (
        SELECT id FROM system_health WHERE system_id = s.id ORDER BY timestamp DESC LIMIT 1
      )
      ORDER BY h.overall_health_score ASC
    `);

    return res.json({
      success: true,
      count: systems.length,
      data: systems
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getSystemHealth,
  getAllSystemsHealth
};

const { all, get } = require('../database/db');

async function getMissionControlOverview(req, res, next) {
  try {
    // 1. Systems counts by status
    const systems = await all('SELECT * FROM energy_systems');
    const totalSystems = systems.length;
    const onlineSystems = systems.filter(s => s.status === 'ONLINE').length;
    const offlineSystems = systems.filter(s => s.status === 'OFFLINE').length;
    const standbySystems = systems.filter(s => s.status === 'STANDBY').length;
    const maintenanceSystems = systems.filter(s => s.status === 'MAINTENANCE').length;
    const faultSystems = systems.filter(s => s.status === 'FAULT').length;
    const activeSystems = onlineSystems + standbySystems;

    // 2. Power and Energy aggregates
    const currentPowerTotal = Number(systems.reduce((acc, s) => acc + (s.current_power_kw || 0), 0).toFixed(2));
    const ratedCapacityTotal = Number(systems.reduce((acc, s) => acc + (s.rated_power_kw || 0), 0).toFixed(2));
    const energyTodayTotal = Number(systems.reduce((acc, s) => acc + (s.energy_today_kwh || 0), 0).toFixed(1));
    const energyLifetimeTotal = Number(systems.reduce((acc, s) => acc + (s.energy_lifetime_mwh || 0), 0).toFixed(1));

    // 3. Fleet averages
    const avgAvailability = totalSystems > 0
      ? Number((systems.reduce((acc, s) => acc + (s.availability_pct || 0), 0) / totalSystems).toFixed(1))
      : 0;
    const avgEfficiency = totalSystems > 0
      ? Number((systems.reduce((acc, s) => acc + (s.efficiency_pct || 0), 0) / totalSystems).toFixed(1))
      : 0;

    // 4. Alerts counts
    const activeAlerts = await get('SELECT COUNT(*) as count FROM alerts WHERE status != "RESOLVED"');
    const criticalAlerts = await get('SELECT COUNT(*) as count FROM alerts WHERE status != "RESOLVED" AND severity = "CRITICAL"');

    // 5. Recent Events
    const recentEvents = await all('SELECT * FROM events ORDER BY created_at DESC LIMIT 8');

    // 6. Current Operating Conditions (derived from latest telemetry of online systems)
    const latestTelemetries = await all(`
      SELECT t.wind_speed_ms, t.temperature_c, t.tether_tension_kn
      FROM telemetry t
      INNER JOIN (
        SELECT system_id, MAX(timestamp) as max_time
        FROM telemetry
        GROUP BY system_id
      ) latest ON t.system_id = latest.system_id AND t.timestamp = latest.max_time
    `);

    let avgWindSpeed = 0;
    let avgTemp = 28.0;
    if (latestTelemetries.length > 0) {
      avgWindSpeed = Number((latestTelemetries.reduce((acc, t) => acc + t.wind_speed_ms, 0) / latestTelemetries.length).toFixed(1));
      avgTemp = Number((latestTelemetries.reduce((acc, t) => acc + t.temperature_c, 0) / latestTelemetries.length).toFixed(1));
    }

    // 7. System Health Fleet Score
    const healthRows = await all('SELECT overall_health_score FROM system_health ORDER BY timestamp DESC LIMIT 6');
    const fleetHealthScore = healthRows.length > 0
      ? Math.round(healthRows.reduce((a, b) => a + b.overall_health_score, 0) / healthRows.length)
      : 92;

    return res.json({
      success: true,
      timestamp: new Date().toISOString(),
      overview: {
        total_systems: totalSystems,
        active_systems: activeSystems,
        online_systems: onlineSystems,
        offline_systems: offlineSystems,
        standby_systems: standbySystems,
        maintenance_systems: maintenanceSystems,
        fault_systems: faultSystems,
        rated_capacity_kw: ratedCapacityTotal,
        current_power_output_kw: currentPowerTotal,
        energy_generated_today_kwh: energyTodayTotal,
        energy_generated_lifetime_mwh: energyLifetimeTotal,
        system_availability_pct: avgAvailability,
        system_efficiency_pct: avgEfficiency,
        active_alerts: activeAlerts ? activeAlerts.count : 0,
        critical_alerts: criticalAlerts ? criticalAlerts.count : 0,
        fleet_health_score: fleetHealthScore,
        operating_conditions: {
          average_wind_speed_ms: avgWindSpeed,
          ambient_temperature_c: avgTemp,
          air_density_kg_m3: 1.225,
          weather_summary: avgWindSpeed > 10 ? 'High-Velocity High-Altitude Stream' : 'Steady Operational Wind'
        }
      },
      systems,
      recent_events: recentEvents
    });
  } catch (err) {
    next(err);
  }
}

async function getLiveMonitoringFeed(req, res, next) {
  try {
    const liveData = await all(`
      SELECT s.id, s.system_name, s.model, s.location, s.status, s.rated_power_kw,
             t.power_output_kw, t.voltage_v, t.current_a, t.wind_speed_ms,
             t.wind_direction_deg, t.tether_tension_kn, t.rotor_rpm,
             t.flight_altitude_m, t.temperature_c, t.battery_soc_pct,
             t.timestamp as latest_timestamp
      FROM energy_systems s
      LEFT JOIN telemetry t ON t.id = (
        SELECT id FROM telemetry
        WHERE system_id = s.id
        ORDER BY timestamp DESC
        LIMIT 1
      )
      ORDER BY s.rated_power_kw DESC
    `);

    return res.json({
      success: true,
      timestamp: new Date().toISOString(),
      count: liveData.length,
      data: liveData
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getMissionControlOverview,
  getLiveMonitoringFeed
};

const { all, run } = require('../database/db');

let simulatorInterval = null;

function startTelemetrySimulator() {
  if (simulatorInterval) return;

  console.log('[Telemetry Simulator] Starting live high-altitude wind telemetry worker...');

  simulatorInterval = setInterval(async () => {
    try {
      const onlineSystems = await all("SELECT id, rated_power_kw, current_power_kw, energy_today_kwh FROM energy_systems WHERE status = 'ONLINE'");

      for (const sys of onlineSystems) {
        // Natural wind speed variation (sinusoidal + noise)
        const baseWind = 10.5;
        const windDrift = Math.sin(Date.now() / 15000) * 2.2 + (Math.random() - 0.5) * 0.8;
        const windSpeed = Number(Math.max(3.2, Math.min(22.0, baseWind + windDrift)).toFixed(1));

        // Power is proportional to cube of wind speed up to rated capacity
        const powerRatio = Math.min(1.0, Math.pow(windSpeed / 12.0, 2.5));
        const powerOutput = Number(Math.max(0.5, Math.min(sys.rated_power_kw, sys.rated_power_kw * powerRatio * 0.95 + (Math.random() - 0.5) * 0.4)).toFixed(2));

        const voltage = 400.0 + (Math.random() - 0.5) * 4.0;
        const current = Number((powerOutput * 1000 / voltage).toFixed(1));
        const tension = Number((14.0 + (powerOutput / sys.rated_power_kw) * 18.0 + (Math.random() - 0.5) * 1.5).toFixed(1));
        const rpm = Math.round(520 + (powerOutput / sys.rated_power_kw) * 280 + (Math.random() - 0.5) * 20);
        const altitude = Math.round(240 + Math.sin(Date.now() / 25000) * 18 + (Math.random() - 0.5) * 5);
        const temp = Number((28.5 + (Math.random() - 0.5) * 0.4).toFixed(1));

        // Insert new telemetry point
        await run(`
          INSERT INTO telemetry (
            system_id, power_output_kw, voltage_v, current_a, wind_speed_ms,
            wind_direction_deg, tether_tension_kn, rotor_rpm, flight_altitude_m,
            temperature_c, battery_soc_pct, system_load_pct, efficiency_pct
          ) VALUES (?, ?, ?, ?, ?, 245.0, ?, ?, ?, ?, 91.0, 78.0, 44.5)
        `, [
          sys.id, powerOutput, Number(voltage.toFixed(1)), current, windSpeed,
          tension, rpm, altitude, temp
        ]);

        // Accumulate energy today (incremental delta for 4 seconds)
        // 4 seconds = 4 / 3600 hours
        const deltaKwh = (powerOutput * 4) / 3600;
        const newTodayKwh = Number((sys.energy_today_kwh + deltaKwh).toFixed(2));

        // Update system current power and today energy
        await run(`
          UPDATE energy_systems
          SET current_power_kw = ?, energy_today_kwh = ?, last_telemetry_at = datetime('now')
          WHERE id = ?
        `, [powerOutput, newTodayKwh, sys.id]);
      }
    } catch (err) {
      console.error('[Telemetry Simulator Error]:', err.message);
    }
  }, 4000);
}

function stopTelemetrySimulator() {
  if (simulatorInterval) {
    clearInterval(simulatorInterval);
    simulatorInterval = null;
    console.log('[Telemetry Simulator] Stopped.');
  }
}

module.exports = {
  startTelemetrySimulator,
  stopTelemetrySimulator
};

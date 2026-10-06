const { exec } = require('./db');

async function initializeSchema() {
  const schemaSQL = `
    -- 1. Users Table
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('Super Admin', 'Admin', 'Operator', 'Customer')),
      company TEXT DEFAULT 'The Source Company',
      phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME
    );

    -- 2. Energy Systems Table (Airborne Wind Energy Systems)
    CREATE TABLE IF NOT EXISTS energy_systems (
      id TEXT PRIMARY KEY,
      system_name TEXT NOT NULL,
      model TEXT NOT NULL,
      serial_number TEXT UNIQUE NOT NULL,
      location TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      rated_power_kw REAL NOT NULL,
      current_power_kw REAL NOT NULL DEFAULT 0.0,
      energy_today_kwh REAL NOT NULL DEFAULT 0.0,
      energy_lifetime_mwh REAL NOT NULL DEFAULT 0.0,
      status TEXT NOT NULL CHECK(status IN ('ONLINE', 'OFFLINE', 'STANDBY', 'MAINTENANCE', 'FAULT')),
      health_status TEXT NOT NULL CHECK(health_status IN ('GOOD', 'FAIR', 'WARNING', 'CRITICAL')),
      availability_pct REAL NOT NULL DEFAULT 98.5,
      efficiency_pct REAL NOT NULL DEFAULT 42.0,
      last_telemetry_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      active_alerts_count INTEGER NOT NULL DEFAULT 0,
      commission_date DATE NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_systems_status ON energy_systems(status);
    CREATE INDEX IF NOT EXISTS idx_systems_model ON energy_systems(model);

    -- 3. System Components / Hardware Table
    CREATE TABLE IF NOT EXISTS system_components (
      id TEXT PRIMARY KEY,
      system_id TEXT NOT NULL,
      component_name TEXT NOT NULL,
      component_type TEXT NOT NULL CHECK(component_type IN (
        'Generator', 'Power Electronics', 'Control System', 'Sensors', 'Mechanical', 'Communication', 'Energy Storage'
      )),
      serial_number TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('ONLINE', 'WARNING', 'FAULT', 'OFFLINE')),
      health_score INTEGER NOT NULL CHECK(health_score BETWEEN 0 AND 100),
      operating_hours REAL NOT NULL DEFAULT 0.0,
      last_maintenance_date DATE,
      next_maintenance_date DATE,
      FOREIGN KEY (system_id) REFERENCES energy_systems(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_components_system ON system_components(system_id);

    -- 4. Live & Historical Telemetry Table
    CREATE TABLE IF NOT EXISTS telemetry (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      system_id TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      power_output_kw REAL NOT NULL,
      voltage_v REAL NOT NULL,
      current_a REAL NOT NULL,
      wind_speed_ms REAL NOT NULL,
      wind_direction_deg REAL NOT NULL,
      tether_tension_kn REAL NOT NULL,
      rotor_rpm REAL NOT NULL,
      flight_altitude_m REAL NOT NULL,
      temperature_c REAL NOT NULL,
      battery_soc_pct REAL NOT NULL,
      system_load_pct REAL NOT NULL,
      efficiency_pct REAL NOT NULL,
      FOREIGN KEY (system_id) REFERENCES energy_systems(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_telemetry_system_time ON telemetry(system_id, timestamp);

    -- 5. Energy Generation Aggregates Table
    CREATE TABLE IF NOT EXISTS energy_generation (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      system_id TEXT NOT NULL,
      date DATE NOT NULL,
      hour INTEGER NOT NULL,
      energy_generated_kwh REAL NOT NULL,
      peak_power_kw REAL NOT NULL,
      avg_wind_speed_ms REAL NOT NULL,
      operating_hours REAL NOT NULL DEFAULT 1.0,
      FOREIGN KEY (system_id) REFERENCES energy_systems(id) ON DELETE CASCADE,
      UNIQUE(system_id, date, hour)
    );

    CREATE INDEX IF NOT EXISTS idx_generation_system_date ON energy_generation(system_id, date);

    -- 6. System Health Diagnostic Table
    CREATE TABLE IF NOT EXISTS system_health (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      system_id TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      overall_health_score INTEGER NOT NULL CHECK(overall_health_score BETWEEN 0 AND 100),
      aerodynamics_score INTEGER NOT NULL,
      tether_winch_score INTEGER NOT NULL,
      generator_score INTEGER NOT NULL,
      power_electronics_score INTEGER NOT NULL,
      storage_score INTEGER NOT NULL,
      control_avionics_score INTEGER NOT NULL,
      fault_count INTEGER NOT NULL DEFAULT 0,
      warning_count INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (system_id) REFERENCES energy_systems(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_health_system ON system_health(system_id);

    -- 7. Alerts Table
    CREATE TABLE IF NOT EXISTS alerts (
      id TEXT PRIMARY KEY,
      system_id TEXT NOT NULL,
      alert_type TEXT NOT NULL,
      severity TEXT NOT NULL CHECK(severity IN ('INFO', 'WARNING', 'CRITICAL')),
      status TEXT NOT NULL CHECK(status IN ('ACTIVE', 'ACKNOWLEDGED', 'RESOLVED')),
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      threshold_breached TEXT,
      triggered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      acknowledged_at DATETIME,
      acknowledged_by TEXT,
      resolved_at DATETIME,
      resolved_by TEXT,
      FOREIGN KEY (system_id) REFERENCES energy_systems(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_alerts_system_status ON alerts(system_id, status);
    CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);

    -- 8. Operational Events Table
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      system_id TEXT,
      event_type TEXT NOT NULL,
      event_source TEXT NOT NULL,
      severity TEXT NOT NULL CHECK(severity IN ('INFO', 'WARNING', 'CRITICAL')),
      description TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (system_id) REFERENCES energy_systems(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_events_created ON events(created_at);

    -- 9. Maintenance / Operations Records Table
    CREATE TABLE IF NOT EXISTS maintenance_records (
      id TEXT PRIMARY KEY,
      system_id TEXT NOT NULL,
      component_id TEXT,
      maintenance_type TEXT NOT NULL CHECK(maintenance_type IN ('PREVENTATIVE', 'CORRECTIVE', 'EMERGENCY', 'INSPECTION')),
      status TEXT NOT NULL CHECK(status IN ('SCHEDULED', 'IN PROGRESS', 'COMPLETED', 'OVERDUE')),
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      scheduled_date DATE NOT NULL,
      completed_date DATE,
      technician TEXT NOT NULL,
      notes TEXT,
      next_due_date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (system_id) REFERENCES energy_systems(id) ON DELETE CASCADE,
      FOREIGN KEY (component_id) REFERENCES system_components(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_maintenance_status ON maintenance_records(status);

    -- 10. System Configurations Table
    CREATE TABLE IF NOT EXISTS system_configurations (
      system_id TEXT PRIMARY KEY,
      cut_in_wind_speed REAL NOT NULL DEFAULT 3.0,
      cut_out_wind_speed REAL NOT NULL DEFAULT 25.0,
      max_altitude_m REAL NOT NULL DEFAULT 350.0,
      max_tension_kn REAL NOT NULL DEFAULT 45.0,
      max_rotor_rpm REAL NOT NULL DEFAULT 850.0,
      overtemp_threshold_c REAL NOT NULL DEFAULT 75.0,
      low_voltage_cutoff_v REAL NOT NULL DEFAULT 360.0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (system_id) REFERENCES energy_systems(id) ON DELETE CASCADE
    );
  `;

  await exec(schemaSQL);

  // Auto-migrate users table if existing table lacks Customer role check
  const { get } = require('./db');
  try {
    const tableInfo = await get("SELECT sql FROM sqlite_master WHERE type='table' AND name='users'");
    if (tableInfo && tableInfo.sql && !tableInfo.sql.includes('Customer')) {
      await exec(`
        PRAGMA foreign_keys=off;
        CREATE TABLE users_temp (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          name TEXT NOT NULL,
          role TEXT NOT NULL CHECK(role IN ('Super Admin', 'Admin', 'Operator', 'Customer')),
          company TEXT DEFAULT 'The Source Company',
          phone TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_login DATETIME
        );
        INSERT INTO users_temp SELECT * FROM users;
        DROP TABLE users;
        ALTER TABLE users_temp RENAME TO users;
        PRAGMA foreign_keys=on;
      `);
      console.log('[Migration] Migrated users table to support Customer and Super Admin roles.');
    }
  } catch (err) {
    console.error('[Migration] Migration check error:', err);
  }
}

module.exports = {
  initializeSchema
};

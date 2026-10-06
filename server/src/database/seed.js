const bcrypt = require('bcryptjs');
const { get, run, all } = require('./db');

async function ensureCoreUsers() {
  const usersToSeed = [
    {
      id: 'usr-admin-01',
      email: 'admin@thesource-company.in',
      pass: 'Admin@Source2026!',
      name: 'Chief Operations Officer',
      role: 'Admin',
      company: 'The Source Company HQ',
      phone: '+91 98765 43210'
    },
    {
      id: 'usr-op-01',
      email: 'operator@thesource-company.in',
      pass: 'Operator@Source2026!',
      name: 'Lead Flight & Grid Engineer',
      role: 'Operator',
      company: 'The Source Operations Center',
      phone: '+91 98765 43211'
    },
    {
      id: 'usr-cust-01',
      email: 'customer@thesource-company.in',
      pass: 'Customer@Source2026!',
      name: 'Site Stakeholder / Off-Taker',
      role: 'Customer',
      company: 'Clean Energy Utilities Ltd',
      phone: '+91 98765 43212'
    },
    {
      id: 'usr-super-01',
      email: 'thesource.companyweb@gmail.com',
      pass: 'TheSourceTon@2004',
      name: 'System Administrator',
      role: 'Super Admin',
      company: 'The Source Company',
      phone: '+91 99999 99999'
    }
  ];

  for (const u of usersToSeed) {
    const existing = await get('SELECT id FROM users WHERE LOWER(email) = LOWER(?)', [u.email]);
    if (!existing) {
      const hash = await bcrypt.hash(u.pass, 10);
      await run(`
        INSERT INTO users (id, email, password_hash, name, role, company, phone)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [u.id, u.email, hash, u.name, u.role, u.company, u.phone]);
      console.log(`[Seed] Provisioned core account: ${u.email} (${u.role})`);
    }
  }
}

async function seedDatabase() {
  // Always verify core system users exist
  await ensureCoreUsers();

  // Check if full dataset already seeded
  const existingSystems = await get('SELECT id FROM energy_systems LIMIT 1');
  if (existingSystems) {
    return;
  }

  console.log('Seeding initial Source Company energy platform data...');

  // 2. Seed Energy Systems
  const systems = [
    {
      id: 'SYS-X1-001',
      name: 'Alpha Tether-01',
      model: 'Airborne Wind Turbine X1',
      serial: 'TSC-X1-2025-001',
      location: 'Kutch Renewable Energy Park, Gujarat',
      lat: 23.242,
      lng: 69.666,
      rated: 12.0,
      current: 9.8,
      today: 142.4,
      lifetime: 48.6,
      status: 'ONLINE',
      health: 'GOOD',
      avail: 99.2,
      eff: 44.5,
      alerts: 0,
      commission: '2025-01-15'
    },
    {
      id: 'SYS-EM20-002',
      name: 'Ember High-Wind 02',
      model: 'Ember 20M',
      serial: 'TSC-EM20-2025-008',
      location: 'Thar Industrial Microgrid, Rajasthan',
      lat: 26.915,
      lng: 70.908,
      rated: 20.0,
      current: 16.2,
      today: 218.6,
      lifetime: 84.2,
      status: 'ONLINE',
      health: 'GOOD',
      avail: 98.7,
      eff: 46.1,
      alerts: 0,
      commission: '2025-02-10'
    },
    {
      id: 'SYS-MC3-003',
      name: 'Micro-Kite Remote 03',
      model: 'Micro-Tether C3',
      serial: 'TSC-MC3-2025-019',
      location: 'Western Ghats Telecom Tower 4, Maharashtra',
      lat: 18.520,
      lng: 73.856,
      rated: 5.0,
      current: 4.1,
      today: 54.8,
      lifetime: 19.3,
      status: 'ONLINE',
      health: 'GOOD',
      avail: 97.9,
      eff: 41.2,
      alerts: 1,
      commission: '2025-03-01'
    },
    {
      id: 'SYS-MK9-004',
      name: 'Offshore Goliath 01',
      model: 'Offshore MegaKite V9',
      serial: 'TSC-MK9-2025-002',
      location: 'Gulf of Khambhat Marine Platform, Gujarat',
      lat: 21.764,
      lng: 72.151,
      rated: 100.0,
      current: 0.0,
      today: 18.2,
      lifetime: 210.5,
      status: 'STANDBY',
      health: 'FAIR',
      avail: 96.5,
      eff: 38.0,
      alerts: 1,
      commission: '2025-04-12'
    },
    {
      id: 'SYS-EM20-005',
      name: 'Ember Hybrid 05',
      model: 'Ember 20M',
      serial: 'TSC-EM20-2025-014',
      location: 'Anantapur Hybrid Energy Hub, Andhra Pradesh',
      lat: 14.681,
      lng: 77.600,
      rated: 20.0,
      current: 0.0,
      today: 0.0,
      lifetime: 62.4,
      status: 'MAINTENANCE',
      health: 'WARNING',
      avail: 93.8,
      eff: 43.0,
      alerts: 1,
      commission: '2025-02-28'
    },
    {
      id: 'SYS-X1-006',
      name: 'Desert Pioneer 06',
      model: 'Airborne Wind Turbine X1',
      serial: 'TSC-X1-2025-027',
      location: 'Jaisalmer Flight Testing Range, Rajasthan',
      lat: 26.901,
      lng: 70.912,
      rated: 12.0,
      current: 0.0,
      today: 12.1,
      lifetime: 33.7,
      status: 'FAULT',
      health: 'CRITICAL',
      avail: 89.4,
      eff: 39.5,
      alerts: 2,
      commission: '2025-03-20'
    }
  ];

  for (const s of systems) {
    await run(`
      INSERT INTO energy_systems (
        id, system_name, model, serial_number, location, latitude, longitude,
        rated_power_kw, current_power_kw, energy_today_kwh, energy_lifetime_mwh,
        status, health_status, availability_pct, efficiency_pct, active_alerts_count, commission_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      s.id, s.name, s.model, s.serial, s.location, s.lat, s.lng,
      s.rated, s.current, s.today, s.lifetime,
      s.status, s.health, s.avail, s.eff, s.alerts, s.commission
    ]);

    // Seed System Configurations
    await run(`
      INSERT INTO system_configurations (
        system_id, cut_in_wind_speed, cut_out_wind_speed, max_altitude_m, max_tension_kn, max_rotor_rpm, overtemp_threshold_c, low_voltage_cutoff_v
      ) VALUES (?, 3.0, 25.0, 350.0, 48.0, 850.0, 75.0, 360.0)
    `, [s.id]);

    // Seed Components for this system
    const components = [
      { id: `${s.id}-CMP-GEN`, name: 'Permanent Magnet Synchronous Generator', type: 'Generator', serial: `GEN-${s.serial}`, status: s.status === 'FAULT' ? 'WARNING' : 'ONLINE', health: s.status === 'FAULT' ? 68 : 98, hours: 2450.5 },
      { id: `${s.id}-CMP-INV`, name: 'Bidirectional Four-Quadrant Inverter', type: 'Power Electronics', serial: `INV-${s.serial}`, status: 'ONLINE', health: 96, hours: 2450.5 },
      { id: `${s.id}-CMP-TET`, name: 'Ultra-High Molecular Weight Dyneema Tether', type: 'Mechanical', serial: `TET-${s.serial}`, status: s.status === 'MAINTENANCE' ? 'WARNING' : (s.status === 'FAULT' ? 'FAULT' : 'ONLINE'), health: s.status === 'FAULT' ? 42 : (s.status === 'MAINTENANCE' ? 74 : 95), hours: 2100.0 },
      { id: `${s.id}-CMP-WNC`, name: 'Direct-Drive High-Torque Winch Drum', type: 'Mechanical', serial: `WNC-${s.serial}`, status: s.status === 'MAINTENANCE' ? 'WARNING' : 'ONLINE', health: s.status === 'MAINTENANCE' ? 70 : 94, hours: 2450.5 },
      { id: `${s.id}-CMP-AVI`, name: 'Autopilot Avionics Flight Control Unit', type: 'Control System', serial: `AVI-${s.serial}`, status: 'ONLINE', health: 99, hours: 2450.5 },
      { id: `${s.id}-CMP-BAT`, name: 'LiFePO4 Ground Buffer Storage Rack (50 kWh)', type: 'Energy Storage', serial: `BAT-${s.serial}`, status: 'ONLINE', health: 97, hours: 2450.5 },
      { id: `${s.id}-CMP-SEN`, name: 'Ultrasonic 3D Anemometer & Pitot Array', type: 'Sensors', serial: `SEN-${s.serial}`, status: 'ONLINE', health: 96, hours: 2450.5 },
      { id: `${s.id}-CMP-COM`, name: 'Industrial LoRa / 4G Cellular Telemetry Gateway', type: 'Communication', serial: `COM-${s.serial}`, status: 'ONLINE', health: 100, hours: 2450.5 }
    ];

    for (const c of components) {
      await run(`
        INSERT INTO system_components (
          id, system_id, component_name, component_type, serial_number, status, health_score, operating_hours, last_maintenance_date, next_maintenance_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, '2025-08-15', '2026-02-15')
      `, [c.id, s.id, c.name, c.type, c.serial, c.status, c.health, c.hours]);
    }

    // Seed System Health record
    const hScore = s.status === 'ONLINE' ? 96 : (s.status === 'STANDBY' ? 88 : (s.status === 'MAINTENANCE' ? 72 : 46));
    await run(`
      INSERT INTO system_health (
        system_id, overall_health_score, aerodynamics_score, tether_winch_score, generator_score, power_electronics_score, storage_score, control_avionics_score, fault_count, warning_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      s.id, hScore,
      hScore - 2, hScore - 6, hScore + 1, hScore, hScore + 2, 98,
      s.status === 'FAULT' ? 1 : 0,
      s.alerts
    ]);
  }

  // 3. Seed Telemetry (historical points across the last 24 hours for SYS-X1-001, SYS-EM20-002, etc.)
  console.log('Seeding telemetry time-series records...');
  const now = new Date();
  for (let i = 24; i >= 0; i--) {
    const tTime = new Date(now.getTime() - i * 3600 * 1000).toISOString();
    
    // SYS-X1-001
    const pX1 = Number((8.5 + Math.sin(i / 3) * 2.5 + Math.random() * 0.8).toFixed(2));
    const wX1 = Number((9.2 + Math.sin(i / 3) * 2.0 + Math.random() * 0.5).toFixed(1));
    await run(`
      INSERT INTO telemetry (
        system_id, timestamp, power_output_kw, voltage_v, current_a, wind_speed_ms, wind_direction_deg,
        tether_tension_kn, rotor_rpm, flight_altitude_m, temperature_c, battery_soc_pct, system_load_pct, efficiency_pct
      ) VALUES ('SYS-X1-001', ?, ?, 401.2, ?, ?, 245.0, ?, 640.0, 240.0, 28.4, 91.5, 78.0, 44.2)
    `, [tTime, pX1, Number((pX1 * 1000 / 401.2).toFixed(1)), wX1, Number((18.5 + pX1 * 0.8).toFixed(1))]);

    // SYS-EM20-002
    const pEM = Number((14.0 + Math.sin(i / 2.5) * 3.5 + Math.random() * 1.0).toFixed(2));
    const wEM = Number((11.4 + Math.sin(i / 2.5) * 2.2 + Math.random() * 0.6).toFixed(1));
    await run(`
      INSERT INTO telemetry (
        system_id, timestamp, power_output_kw, voltage_v, current_a, wind_speed_ms, wind_direction_deg,
        tether_tension_kn, rotor_rpm, flight_altitude_m, temperature_c, battery_soc_pct, system_load_pct, efficiency_pct
      ) VALUES ('SYS-EM20-002', ?, ?, 480.0, ?, ?, 260.0, ?, 780.0, 310.0, 31.0, 88.0, 82.5, 46.5)
    `, [tTime, pEM, Number((pEM * 1000 / 480.0).toFixed(1)), wEM, Number((26.0 + pEM * 0.9).toFixed(1))]);
  }

  // 4. Seed Energy Generation daily and hourly aggregates
  for (let d = 7; d >= 0; d--) {
    const dStr = new Date(now.getTime() - d * 86400 * 1000).toISOString().split('T')[0];
    for (let h = 0; h < 24; h += 4) {
      await run(`
        INSERT OR IGNORE INTO energy_generation (
          system_id, date, hour, energy_generated_kwh, peak_power_kw, avg_wind_speed_ms, operating_hours
        ) VALUES
        ('SYS-X1-001', ?, ?, ?, ?, 9.8, 4.0),
        ('SYS-EM20-002', ?, ?, ?, ?, 11.2, 4.0)
      `, [
        dStr, h, Number((32.0 + Math.random() * 8).toFixed(1)), Number((11.0 + Math.random() * 1.5).toFixed(1)),
        dStr, h, Number((58.0 + Math.random() * 12).toFixed(1)), Number((18.5 + Math.random() * 1.8).toFixed(1))
      ]);
    }
  }

  // 5. Seed Alerts
  await run(`
    INSERT INTO alerts (
      id, system_id, alert_type, severity, status, title, description, threshold_breached, triggered_at
    ) VALUES
    ('ALT-2026-001', 'SYS-X1-006', 'Tether Tension Anomaly', 'CRITICAL', 'ACTIVE', 'Peak Dynamic Tension Exceeded 42 kN', 'Tension load cell registered sudden load transient at 280m altitude during wind gust.', 'Tension > 40.0 kN (Measured: 43.8 kN)', datetime('now', '-2 hours')),
    ('ALT-2026-002', 'SYS-X1-006', 'Flight Trajectory Warning', 'WARNING', 'ACTIVE', 'Crosswind Figure-8 Deviation', 'Avionics detected crosswind roll axis variance exceeding 4.5 degrees.', 'Yaw/Roll Variance > 3.0 deg', datetime('now', '-3 hours')),
    ('ALT-2026-003', 'SYS-EM20-005', 'Scheduled Winch Maintenance Due', 'WARNING', 'ACTIVE', 'Winch Drum Cable Inspection Required', 'Operational duty cycle reached 2,000 hours without winch rope lubrication.', 'Service Interval >= 2000 hrs', datetime('now', '-1 day')),
    ('ALT-2026-004', 'SYS-MC3-003', 'Anemometer Calibration Drift', 'INFO', 'ACTIVE', 'Sensor Redundancy Divergence', 'Ultrasonic and mechanical anemometer readings diverging by 8%.', 'Delta > 5%', datetime('now', '-4 hours')),
    ('ALT-2026-005', 'SYS-MK9-004', 'Low Ambient Wind Retraction', 'INFO', 'ACKNOWLEDGED', 'Airborne Kite Safe Landing Completed', 'System autonomous landing routine completed due to wind dropping below 3.0 m/s.', 'Wind < 3.0 m/s', datetime('now', '-5 hours')),
    ('ALT-2026-006', 'SYS-EM20-002', 'Generator Temperature Spike', 'WARNING', 'RESOLVED', 'Generator Stator Over-temperature Restored', 'Stator core cooled to nominal 54°C following auxiliary ventilation activation.', 'Temp > 70°C (Peak: 73.2°C)', datetime('now', '-18 hours'))
  `);

  // 6. Seed Operational Events
  await run(`
    INSERT INTO events (system_id, event_type, event_source, severity, description, created_at) VALUES
    ('SYS-X1-001', 'AUTOPILOT_TRANSITION', 'Flight Control', 'INFO', 'Airborne kite engaged autonomous power-generation figure-8 cycle.', datetime('now', '-30 minutes')),
    ('SYS-EM20-002', 'GRID_SYNC', 'Power Electronics', 'INFO', 'Inverter successfully synchronized with microgrid bus at 480V 50Hz.', datetime('now', '-1 hour')),
    ('SYS-MK9-004', 'RETRACTION_TRIGGER', 'Weather Safety', 'INFO', 'High-altitude calm detected; tether winch automated descent protocol engaged.', datetime('now', '-5 hours')),
    ('SYS-X1-006', 'AUTO_HOLD_ENGAGED', 'Safety Interlock', 'CRITICAL', 'Emergency aerodynamic depower brake deployed due to tension threshold.', datetime('now', '-2 hours')),
    ('SYS-EM20-005', 'MAINTENANCE_LOCK', 'Manual Override', 'WARNING', 'System isolated for technician winch maintenance inspection.', datetime('now', '-1 day'))
  `);

  // 7. Seed Maintenance Records
  await run(`
    INSERT INTO maintenance_records (
      id, system_id, component_id, maintenance_type, status, title, description,
      scheduled_date, technician, notes, next_due_date
    ) VALUES
    ('MNT-2026-081', 'SYS-EM20-005', 'SYS-EM20-005-CMP-WNC', 'PREVENTATIVE', 'IN PROGRESS', 'Winch Drum Re-spooling & Lubrication', 'Inspect tether rope layering across the winch drum and verify level-wind synchronizer.', date('now'), 'Vikram Singh (Lead Mechatronics Tech)', 'Replacing level-wind guide roller bearings and applying synthetic lubricant.', date('now', '+90 days')),
    ('MNT-2026-082', 'SYS-X1-006', 'SYS-X1-006-CMP-TET', 'CORRECTIVE', 'SCHEDULED', 'Tension Load Cell Sensor Replacement', 'Calibrate or replace load cell transducer at ground bridle attachment.', date('now', '+1 day'), 'Arun Patel (Instrumentation Engineer)', 'Awaiting calibrated 50kN load cell delivery.', date('now', '+60 days')),
    ('MNT-2026-079', 'SYS-X1-001', 'SYS-X1-001-CMP-GEN', 'INSPECTION', 'COMPLETED', 'Quarterly Generator Insulation Resistance Test', 'Megger test of 12kW PMSG windings and slip rings.', date('now', '-14 days'), 'Vikram Singh', 'Insulation resistance > 200 MOhm. Passed all IEC 61400 requirements.', date('now', '+76 days')),
    ('MNT-2026-080', 'SYS-MC3-003', 'SYS-MC3-003-CMP-SEN', 'PREVENTATIVE', 'SCHEDULED', 'Anemometer Array Recalibration', 'Sonic sensor recalibration and zero-offset inspection.', date('now', '+3 days'), 'Priya Rao (Field Engineer)', 'Standard semi-annual sensor alignment protocol.', date('now', '+180 days'))
  `);

  console.log('Database seeding successfully completed!');
}

module.exports = {
  seedDatabase
};

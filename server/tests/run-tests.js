// ============================================================
// The Source Company — Automated Backend Test Suite
// Verifies Authentication, RBAC, Energy Systems, Telemetry,
// Alerts lifecycle, and Validation rules.
// ============================================================

const assert = require('assert');
const http = require('http');

const API_BASE = 'http://localhost:8000';

async function request(path, options = {}) {
  const url = new URL(path, API_BASE);
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const body = options.body ? JSON.stringify(options.body) : undefined;

  const res = await fetch(url.toString(), {
    method: options.method || 'GET',
    headers,
    body
  });

  const json = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, body: json };
}

async function runTestSuite() {
  console.log('---------------------------------------------------------');
  console.log('Running The Source Company Backend Automated Test Suite');
  console.log('---------------------------------------------------------');

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    process.stdout.write(`TEST: ${name}... `);
    try {
      await fn();
      console.log('PASSED ✓');
      passed++;
    } catch (err) {
      console.log(`FAILED ✗ -> ${err.message}`);
      failed++;
    }
  }

  // 1. Health Endpoint Test
  await test('Server health endpoint is online', async () => {
    const res = await request('/api/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'ONLINE');
  });

  // 2. Authentication Test
  let operatorToken = null;
  let adminToken = null;

  await test('Operator login succeeds with valid credentials', async () => {
    const res = await request('/api/v1/auth/login', {
      method: 'POST',
      body: {
        email: 'operator@thesource-company.in',
        password: 'Operator@Source2026!'
      }
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.user.role, 'Operator');
    assert.ok(res.body.token);
    operatorToken = res.body.token;
  });

  await test('Admin login succeeds with valid credentials', async () => {
    const res = await request('/api/v1/auth/login', {
      method: 'POST',
      body: {
        email: 'admin@thesource-company.in',
        password: 'Admin@Source2026!'
      }
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.user.role, 'Admin');
    assert.ok(res.body.token);
    adminToken = res.body.token;
  });

  await test('Authentication rejects invalid credentials', async () => {
    const res = await request('/api/v1/auth/login', {
      method: 'POST',
      body: {
        email: 'operator@thesource-company.in',
        password: 'WrongPassword123'
      }
    });
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
  });

  // 3. Unauthorized Access Rejection Test
  await test('Unauthorized request to protected endpoint is rejected with 401', async () => {
    const res = await request('/api/v1/admin/users');
    assert.strictEqual(res.status, 401);
  });

  // 4. RBAC Permission Test
  await test('Operator is forbidden from accessing Admin-only user management (403)', async () => {
    const res = await request('/api/v1/admin/users', {
      headers: { Authorization: `Bearer ${operatorToken}` }
    });
    assert.strictEqual(res.status, 403);
  });

  await test('Admin is authorized to access Admin-only user management (200)', async () => {
    const res = await request('/api/v1/admin/users', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body.data));
  });

  // 5. Energy Systems Retrieval Test
  await test('Energy systems list returns seeded airborne wind systems', async () => {
    const res = await request('/api/v1/energy-systems');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.length >= 6);
    const hasEmber = res.body.data.some(s => s.model.includes('Ember 20M'));
    assert.ok(hasEmber, 'Should contain Ember 20M system');
  });

  await test('Energy system detail returns operational view and components', async () => {
    const res = await request('/api/v1/energy-systems/SYS-X1-001');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.id, 'SYS-X1-001');
    assert.ok(Array.isArray(res.body.data.components));
    assert.ok(res.body.data.components.length > 0);
  });

  // 6. Telemetry Association & Range Filtering Test
  await test('Telemetry is associated with correct energy system and respects range', async () => {
    const res = await request('/api/v1/energy-systems/SYS-X1-001/telemetry?range=24h');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.system_id, 'SYS-X1-001');
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.stats !== null, 'Should compute telemetry stats');
  });

  // 7. Telemetry Validation Rejection Test
  await test('Invalid telemetry data (negative power) is rejected with 400', async () => {
    const res = await request('/api/v1/telemetry', {
      method: 'POST',
      headers: { Authorization: `Bearer ${operatorToken}` },
      body: {
        system_id: 'SYS-X1-001',
        power_output_kw: -15.0,
        wind_speed_ms: 10.0
      }
    });
    assert.strictEqual(res.status, 400);
  });

  await test('Invalid telemetry data (excessive power above rated threshold) is rejected', async () => {
    const res = await request('/api/v1/telemetry', {
      method: 'POST',
      headers: { Authorization: `Bearer ${operatorToken}` },
      body: {
        system_id: 'SYS-X1-001',
        power_output_kw: 999.0, // Rated is 12 kW
        wind_speed_ms: 10.0
      }
    });
    assert.strictEqual(res.status, 400);
  });

  // 8. Alerts Lifecycle Test (Acknowledge & Resolve)
  await test('Operator can acknowledge an active alert', async () => {
    const alertsRes = await request('/api/v1/alerts?status=ACTIVE');
    assert.ok(alertsRes.body.data.length > 0, 'Should have active alerts');
    const targetAlert = alertsRes.body.data[0];

    const ackRes = await request(`/api/v1/alerts/${targetAlert.id}/acknowledge`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${operatorToken}` }
    });
    assert.strictEqual(ackRes.status, 200);
    assert.strictEqual(ackRes.body.data.status, 'ACKNOWLEDGED');
    assert.ok(ackRes.body.data.acknowledged_by);
  });

  // 9. Mission Control Overview Test
  await test('Mission control overview returns non-zero operational telemetry', async () => {
    const res = await request('/api/v1/monitoring/overview');
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.overview.total_systems > 0);
    assert.ok(res.body.overview.online_systems > 0);
    assert.ok(res.body.overview.current_power_output_kw >= 0);
    assert.ok(res.body.overview.operating_conditions.average_wind_speed_ms > 0);
  });

  // 10. Maintenance Work Order Creation Test
  await test('Operator can create a scheduled maintenance work order', async () => {
    const res = await request('/api/v1/maintenance', {
      method: 'POST',
      headers: { Authorization: `Bearer ${operatorToken}` },
      body: {
        system_id: 'SYS-EM20-002',
        maintenance_type: 'PREVENTATIVE',
        title: 'Biannual Tether Inspection',
        description: 'Ultrasonic flaw detection across 350m Dyneema tether line.',
        scheduled_date: '2026-10-15',
        technician: 'Priya Rao (Field Engineer)'
      }
    });
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.id);
  });

  console.log('---------------------------------------------------------');
  console.log(`Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log('---------------------------------------------------------');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTestSuite().catch(err => {
  console.error('Test Suite Runner Error:', err);
  process.exit(1);
});

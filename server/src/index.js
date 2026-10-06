const express = require('express');
const cors = require('cors');
const config = require('./config');
const { initializeSchema } = require('./database/schema');
const { seedDatabase } = require('./database/seed');
const { startTelemetrySimulator } = require('./services/telemetrySimulator');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Route Imports
const authRoutes = require('./routes/auth.routes');
const energySystemsRoutes = require('./routes/energySystems.routes');
const telemetryRoutes = require('./routes/telemetry.routes');
const monitoringRoutes = require('./routes/monitoring.routes');
const healthRoutes = require('./routes/health.routes');
const alertsRoutes = require('./routes/alerts.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const componentsRoutes = require('./routes/components.routes');
const maintenanceRoutes = require('./routes/maintenance.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();

// Middlewares
app.use(cors({ origin: config.CORS_ORIGIN, credentials: true }));
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.originalUrl !== '/api/v1/monitoring/live') {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
    }
  });
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'The Source Company Industrial IoT API',
    version: '2.0.0',
    timestamp: new Date().toISOString()
  });
});

// API Documentation Endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    platform: 'The Source Company — Airborne Wind & Renewable Energy Platform',
    version: '2.0.0',
    endpoints: {
      auth: {
        'POST /api/v1/auth/login': 'Authenticate with email & password, returns JWT and user profile',
        'GET /api/v1/auth/me': 'Get current authenticated user profile [Auth Required]'
      },
      energy_systems: {
        'GET /api/v1/energy-systems': 'List all energy systems (supports ?status=, ?model=, ?search=)',
        'GET /api/v1/energy-systems/:id': 'Get complete operational view for an energy system',
        'PATCH /api/v1/energy-systems/:id': 'Update system metadata / status [Admin/Operator]'
      },
      monitoring: {
        'GET /api/v1/monitoring/overview': 'Mission control dashboard KPIs, fleet metrics, active alerts & events',
        'GET /api/v1/monitoring/live': 'Real-time telemetry feed of all connected energy systems'
      },
      telemetry: {
        'GET /api/v1/energy-systems/:id/telemetry': 'Historical telemetry filtered by time range (?range=1h|24h|7d|30d)',
        'GET /api/v1/telemetry': 'Raw telemetry logs (?system_id=, ?limit=)',
        'POST /api/v1/telemetry': 'Ingest new telemetry point with validation [Auth Required]'
      },
      health: {
        'GET /api/v1/health': 'Fleet-wide health diagnostics matrix',
        'GET /api/v1/energy-systems/:id/health': 'Hierarchical health assessment (System -> Subsystems -> Components)'
      },
      alerts: {
        'GET /api/v1/alerts': 'List alerts (?status=ACTIVE|ACKNOWLEDGED|RESOLVED, ?severity=, ?system_id=)',
        'POST /api/v1/alerts': 'Create new alert [Auth Required]',
        'PATCH /api/v1/alerts/:id/acknowledge': 'Acknowledge an alert with operator signature [Admin/Operator]',
        'PATCH /api/v1/alerts/:id/resolve': 'Resolve an alert [Admin/Operator]'
      },
      analytics: {
        'GET /api/v1/analytics/energy': 'Renewable energy analytics: capacity factor, generation trends, hourly profiles'
      },
      components: {
        'GET /api/v1/components': 'Asset registry of system hardware (?system_id=, ?component_type=)',
        'GET /api/v1/components/:id': 'Component details and maintenance history',
        'PATCH /api/v1/components/:id': 'Update component health score / status [Admin/Operator]'
      },
      maintenance: {
        'GET /api/v1/maintenance': 'List work orders (?system_id=, ?status=)',
        'POST /api/v1/maintenance': 'Schedule new maintenance work order [Admin/Operator]',
        'PATCH /api/v1/maintenance/:id': 'Update work order status and completion notes [Admin/Operator]'
      },
      admin: {
        'GET /api/v1/admin/users': 'List all platform users [Admin Only]',
        'POST /api/v1/admin/users': 'Create new user [Admin Only]',
        'GET /api/v1/admin/systems/:system_id/config': 'Get operating envelope configuration [Admin Only]',
        'PUT /api/v1/admin/systems/:system_id/config': 'Update operating envelope cut-in/cut-out thresholds [Admin Only]',
        'GET /api/v1/admin/audit-logs': 'View immutable platform audit trail [Admin Only]'
      }
    }
  });
});

// Mount Routes under /api/v1
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/energy-systems', energySystemsRoutes);
app.use('/api/v1/telemetry', telemetryRoutes);
app.use('/api/v1/monitoring', monitoringRoutes);
app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/alerts', alertsRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/components', componentsRoutes);
app.use('/api/v1/maintenance', maintenanceRoutes);
app.use('/api/v1/admin', adminRoutes);

// Compatibility alias for standard login routes (/auth/login and /api/v1/auth/login)
app.use('/auth', authRoutes);

// 404 & Centralized Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

// Server Bootstrap
async function startServer() {
  try {
    console.log('[Bootstrap] Initializing database relational schema...');
    await initializeSchema();
    await seedDatabase();

    app.listen(config.PORT, () => {
      console.log(`========================================================`);
      console.log(`The Source Company — Renewable Energy API Server Online`);
      console.log(`Listening on http://localhost:${config.PORT}`);
      console.log(`API Docs:    http://localhost:${config.PORT}/api/docs`);
      console.log(`Health:      http://localhost:${config.PORT}/api/health`);
      console.log(`========================================================`);

      // Start live background telemetry simulator
      startTelemetrySimulator();
    });
  } catch (err) {
    console.error('Fatal startup error:', err);
    process.exit(1);
  }
}

startServer();

module.exports = app;

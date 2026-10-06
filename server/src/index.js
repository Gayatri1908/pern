const express = require('express');
const cors = require('cors');
const config = require('./config');
const { initializeSchema } = require('./database/schema');
const { seedDatabase } = require('./database/seed');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Core Case Study Routes
const authRoutes = require('./routes/auth.routes');
const customersRoutes = require('./routes/customers.routes');
const productsRoutes = require('./routes/products.routes');
const enquiriesRoutes = require('./routes/enquiries.routes');
const quotationsRoutes = require('./routes/quotations.routes');
const salesOrdersRoutes = require('./routes/salesOrders.routes');

const app = express();

// Middlewares
app.use(cors({ origin: config.CORS_ORIGIN || '*', credentials: true }));
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// Health check endpoints
app.get(['/health', '/api/health'], (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'PERN Technical Case Study API (Enquiry -> Quotation -> Sales Order -> Dispatch)',
    version: '2.0.0',
    timestamp: new Date().toISOString()
  });
});

// Case Study Documentation Endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    case_study: 'PERN Full-Stack Technical Workflow',
    workflow: 'Login -> Enquiry -> Quotation -> Accepted Quotation -> Sales Order -> Confirm/Reserve -> Dispatch -> Updated Inventory',
    endpoints: {
      auth: {
        'POST /api/v1/auth/login': 'Authenticate ADMIN or SALES_USER with email & password',
        'GET /api/v1/auth/me': 'Get current authenticated user profile'
      },
      customers: {
        'GET /api/v1/customers': 'List all customers',
        'POST /api/v1/customers': 'Create new customer'
      },
      products: {
        'GET /api/v1/products': 'List all products with physical, reserved, and available stock (Available = Physical - Reserved)',
        'GET /api/v1/products/:id': 'Get single product details with stock quantities',
        'PATCH /api/v1/products/:id/stock': 'Update physical stock [ADMIN ONLY]'
      },
      enquiries: {
        'GET /api/v1/enquiries': 'List enquiries with customer & item details',
        'GET /api/v1/enquiries/:id': 'Get enquiry with line items and customer info',
        'POST /api/v1/enquiries': 'Create enquiry supporting multiple products'
      },
      quotations: {
        'GET /api/v1/quotations': 'List quotations with totals and statuses',
        'GET /api/v1/quotations/:id': 'Get quotation with line items and totals',
        'POST /api/v1/quotations': 'Create quotation from enquiry (calculates Subtotal, Discount, GST, Total)',
        'PATCH /api/v1/quotations/:id/send': 'Mark quotation as SENT to customer',
        'PATCH /api/v1/quotations/:id/decision': 'Record customer decision (ACCEPTED or REJECTED)',
        'POST /api/v1/quotations/:id/convert-to-order': 'Convert ACCEPTED quotation to Sales Order'
      },
      sales_orders: {
        'GET /api/v1/sales-orders': 'List sales orders with customer and quotation relationship',
        'GET /api/v1/sales-orders/:id': 'Get sales order with stock availability breakdown for ordered items',
        'POST /api/v1/sales-orders/:id/confirm': 'Confirm order and reserve stock. Physical stock unchanged [ADMIN ONLY]',
        'POST /api/v1/sales-orders/:id/dispatch': 'Process dispatch. Deducts physical and reserved inventory [ADMIN ONLY]'
      }
    }
  });
});

// Mount Core Case Study Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/customers', customersRoutes);
app.use('/api/v1/products', productsRoutes);
app.use('/api/v1/enquiries', enquiriesRoutes);
app.use('/api/v1/quotations', quotationsRoutes);
app.use('/api/v1/sales-orders', salesOrdersRoutes);

// Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

// Bootstrap
async function startServer() {
  try {
    console.log('[Bootstrap] Initializing case study database relational schema...');
    await initializeSchema();
    await seedDatabase();

    const PORT = config.PORT || 8000;
    app.listen(PORT, () => {
      console.log('========================================================');
      console.log(`PERN Case Study API Online: http://localhost:${PORT}`);
      console.log(`Documentation:              http://localhost:${PORT}/api/docs`);
      console.log(`Health Check:               http://localhost:${PORT}/health`);
      console.log('========================================================');
    });
  } catch (err) {
    console.error('[Fatal] Server failed to start:', err);
    process.exit(1);
  }
}

startServer();

module.exports = app;

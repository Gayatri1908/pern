// ============================================================
// Automated End-to-End Workflow Verification for PERN Case Study
// ============================================================

const BASE_URL = 'http://localhost:8000';

async function req(url, options = {}) {
  const res = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
}

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${message}`);
}

async function runTests() {
  console.log('\n========================================================');
  console.log('RUNNING PERN WORKFLOW INTEGRATION TESTS');
  console.log('========================================================\n');

  // 1. Health check
  const health = await req('/health');
  assert(health.status === 200, 'Health check returns 200 OK');

  // 2. Login as ADMIN
  const adminLogin = await req('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@thesource.com', password: 'Admin@123' })
  });
  assert(adminLogin.status === 200 && adminLogin.data.user.role === 'ADMIN', 'Admin login successful');
  const adminToken = adminLogin.data.token;

  // 3. Login as SALES_USER
  const salesLogin = await req('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'sales@thesource.com', password: 'Sales@123' })
  });
  assert(salesLogin.status === 200 && salesLogin.data.user.role === 'SALES_USER', 'Sales user login successful');
  const salesToken = salesLogin.data.token;

  const salesHeaders = { Authorization: `Bearer ${salesToken}` };
  const adminHeaders = { Authorization: `Bearer ${adminToken}` };

  // 4. Products & Available stock calculation
  const productsRes = await req('/api/v1/products', { headers: salesHeaders });
  assert(productsRes.status === 200 && productsRes.data.data.length >= 5, 'Fetched product list');
  const prod1 = productsRes.data.data[0];
  assert(
    prod1.available_quantity === (prod1.physical_quantity - prod1.reserved_quantity),
    `Available stock formula holds: ${prod1.physical_quantity} - ${prod1.reserved_quantity} = ${prod1.available_quantity}`
  );

  // 5. Customers
  const custRes = await req('/api/v1/customers', { headers: salesHeaders });
  assert(custRes.status === 200 && custRes.data.data.length >= 3, 'Fetched customer list');
  const customerId = custRes.data.data[0].id;

  // 6. Create Enquiry with multiple products
  const newEnquiry = await req('/api/v1/enquiries', {
    method: 'POST',
    headers: salesHeaders,
    body: JSON.stringify({
      customer_id: customerId,
      notes: 'End-to-end integration test enquiry',
      items: [
        { product_id: productsRes.data.data[0].id, quantity: 2, target_price: 400000 },
        { product_id: productsRes.data.data[1].id, quantity: 2, target_price: 80000 }
      ]
    })
  });
  assert(newEnquiry.status === 201, 'Created enquiry with multiple products');
  const enquiryId = newEnquiry.data.data.id;

  // 7. Create Quotation from Enquiry
  const unitPrice1 = 420000;
  const unitPrice2 = 82000;
  const qty1 = 2;
  const qty2 = 2;
  const expectedSubtotal = (qty1 * unitPrice1) + (qty2 * unitPrice2); // 840000 + 164000 = 1004000
  const discountPct = 10;
  const expectedDiscount = expectedSubtotal * 0.10; // 100400
  const expectedTaxable = expectedSubtotal - expectedDiscount; // 903600
  const gstRate = 18;
  const expectedGst = expectedTaxable * 0.18; // 162648
  const expectedTotal = expectedTaxable + expectedGst; // 1066248

  const newQuo = await req('/api/v1/quotations', {
    method: 'POST',
    headers: salesHeaders,
    body: JSON.stringify({
      enquiry_id: enquiryId,
      discount_pct: discountPct,
      gst_rate_pct: gstRate,
      valid_until: '2026-12-31',
      items: [
        { product_id: productsRes.data.data[0].id, quantity: qty1, unit_price: unitPrice1 },
        { product_id: productsRes.data.data[1].id, quantity: qty2, unit_price: unitPrice2 }
      ]
    })
  });
  assert(newQuo.status === 201, 'Created quotation from enquiry');
  const quotation = newQuo.data.data;
  assert(quotation.subtotal === expectedSubtotal, `Quotation subtotal calculated correctly (${quotation.subtotal})`);
  assert(quotation.total_amount === expectedTotal, `Quotation total with discount & GST calculated correctly (${quotation.total_amount})`);
  assert(quotation.status === 'DRAFT', 'Quotation starts in DRAFT status');

  // 8. Try converting DRAFT quotation to Sales Order -> MUST FAIL
  const failDraftConvert = await req(`/api/v1/quotations/${quotation.id}/convert-to-order`, {
    method: 'POST',
    headers: salesHeaders
  });
  assert(failDraftConvert.status === 400, 'Rejection of converting unaccepted (DRAFT) quotation to Sales Order');

  // 9. Send Quotation
  const sendRes = await req(`/api/v1/quotations/${quotation.id}/send`, {
    method: 'PATCH',
    headers: salesHeaders
  });
  assert(sendRes.status === 200 && sendRes.data.data.status === 'SENT', 'Quotation marked as SENT');

  // 10. Accept Quotation
  const acceptRes = await req(`/api/v1/quotations/${quotation.id}/decision`, {
    method: 'PATCH',
    headers: salesHeaders,
    body: JSON.stringify({ decision: 'ACCEPTED' })
  });
  assert(acceptRes.status === 200 && acceptRes.data.data.status === 'ACCEPTED', 'Quotation marked as ACCEPTED');

  // 11. Convert ACCEPTED Quotation to Sales Order -> MUST SUCCEED
  const orderRes = await req(`/api/v1/quotations/${quotation.id}/convert-to-order`, {
    method: 'POST',
    headers: salesHeaders
  });
  assert(orderRes.status === 201, 'Converted ACCEPTED quotation to Sales Order');
  const salesOrder = orderRes.data.data;
  assert(salesOrder.status === 'PENDING', 'New Sales Order status is PENDING');

  // 12. Try converting same quotation again -> MUST FAIL
  const failDuplicateConvert = await req(`/api/v1/quotations/${quotation.id}/convert-to-order`, {
    method: 'POST',
    headers: salesHeaders
  });
  assert(failDuplicateConvert.status === 400, 'Duplicate order conversion rejected');

  // 13. Get Sales Order details and verify inventory availability breakdown
  const orderDetails = await req(`/api/v1/sales-orders/${salesOrder.id}`, { headers: salesHeaders });
  assert(orderDetails.status === 200, 'Fetched Sales Order details with stock breakdown');
  assert(orderDetails.data.data.items.length === 2, 'Sales Order contains 2 line items');
  for (const item of orderDetails.data.data.items) {
    assert(
      item.available_quantity === (item.physical_quantity - item.reserved_quantity),
      `Line item available stock accurate: ${item.product_name} (${item.available_quantity})`
    );
  }

  // 14. SALES_USER attempts to confirm order -> MUST BE FORBIDDEN (403)
  const failSalesConfirm = await req(`/api/v1/sales-orders/${salesOrder.id}/confirm`, {
    method: 'POST',
    headers: salesHeaders
  });
  assert(failSalesConfirm.status === 403, 'RBAC prevents SALES_USER from confirming order');

  // 15. Check initial product stock before confirmation
  const p1Before = await req(`/api/v1/products/${productsRes.data.data[0].id}`, { headers: adminHeaders });
  const initPhysical = p1Before.data.data.physical_quantity;
  const initReserved = p1Before.data.data.reserved_quantity;

  // 16. ADMIN confirms order -> RESERVES STOCK (Physical stock must NOT change)
  const confirmRes = await req(`/api/v1/sales-orders/${salesOrder.id}/confirm`, {
    method: 'POST',
    headers: adminHeaders
  });
  assert(confirmRes.status === 200, 'ADMIN confirmed Sales Order');
  assert(confirmRes.data.data.status === 'CONFIRMED', 'Sales Order status updated to CONFIRMED');

  // Verify stock reservation: physical unchanged, reserved increased by 2
  const p1AfterConfirm = await req(`/api/v1/products/${productsRes.data.data[0].id}`, { headers: adminHeaders });
  assert(
    p1AfterConfirm.data.data.physical_quantity === initPhysical,
    `Physical stock UNCHANGED after confirmation (${initPhysical})`
  );
  assert(
    p1AfterConfirm.data.data.reserved_quantity === (initReserved + qty1),
    `Reserved stock INCREASED by ${qty1} (${initReserved} -> ${p1AfterConfirm.data.data.reserved_quantity})`
  );

  // 17. SALES_USER attempts to dispatch order -> MUST BE FORBIDDEN (403)
  const failSalesDispatch = await req(`/api/v1/sales-orders/${salesOrder.id}/dispatch`, {
    method: 'POST',
    headers: salesHeaders,
    body: JSON.stringify({ tracking_number: 'TEST-TRK-001' })
  });
  assert(failSalesDispatch.status === 403, 'RBAC prevents SALES_USER from dispatching order');

  // 18. ADMIN dispatches order -> Deducts BOTH physical and reserved stock
  const dispatchRes = await req(`/api/v1/sales-orders/${salesOrder.id}/dispatch`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({ tracking_number: 'TRK-2026-EXPRESS-01', notes: 'Dispatched via Express Cargo' })
  });
  assert(dispatchRes.status === 200, 'ADMIN dispatched Sales Order');
  assert(dispatchRes.data.data.status === 'DISPATCHED', 'Sales Order status updated to DISPATCHED');

  // Verify stock deduction after dispatch
  const p1AfterDispatch = await req(`/api/v1/products/${productsRes.data.data[0].id}`, { headers: adminHeaders });
  assert(
    p1AfterDispatch.data.data.physical_quantity === (initPhysical - qty1),
    `Physical stock DECREASED by ${qty1} (${initPhysical} -> ${p1AfterDispatch.data.data.physical_quantity})`
  );
  assert(
    p1AfterDispatch.data.data.reserved_quantity === initReserved,
    `Reserved stock DECREASED back (${p1AfterDispatch.data.data.reserved_quantity})`
  );

  // 19. Prevent duplicate dispatch -> MUST FAIL (400)
  const failDupDispatch = await req(`/api/v1/sales-orders/${salesOrder.id}/dispatch`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({ tracking_number: 'TRK-DUPLICATE' })
  });
  assert(failDupDispatch.status === 400, 'Duplicate dispatch prevented with error message');

  console.log('\n========================================================');
  console.log('🎉 ALL 19 PERN WORKFLOW TESTS PASSED SUCCESSFULLY!');
  console.log('========================================================\n');
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});

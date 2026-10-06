"use client";
import React, { useState, useEffect } from "react";
import { Search, Eye, CheckCircle, Truck, AlertTriangle, ShieldAlert, Package, Check, ArrowRight, Box, Clock } from "lucide-react";
import { api } from "@/lib/api";
import type { SalesOrder, User } from "@/types";

interface SalesOrdersViewProps {
  user: User;
  initialOrderId?: string | null;
}

export function SalesOrdersView({ user, initialOrderId }: SalesOrdersViewProps) {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [dispatchModal, setDispatchModal] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [dispatchNotes, setDispatchNotes] = useState("");

  const isAdmin = user.role === "ADMIN" || user.role === "Super Admin";

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await api.salesOrders.list();
      setOrders(res.data || []);
      if (initialOrderId) {
        viewOrder(initialOrderId);
      }
    } catch (err: any) {
      alert(err.message || "Failed to load sales orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [initialOrderId]);

  const viewOrder = async (id: string) => {
    try {
      const res = await api.salesOrders.get(id);
      setSelectedOrder(res.data);
    } catch (err: any) {
      alert(err.message || "Failed to fetch order details");
    }
  };

  const handleConfirmOrder = async (id: string) => {
    if (!isAdmin) {
      alert("Permission denied. Only ADMIN can confirm sales orders and reserve stock.");
      return;
    }
    if (!confirm("Confirm this order? This will reserve available inventory for all ordered products without decreasing physical stock.")) return;

    setActionLoading(true);
    try {
      const res = await api.salesOrders.confirm(id);
      alert(res.message);
      await loadOrders();
      viewOrder(id);
    } catch (err: any) {
      alert(`Confirmation Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDispatchOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    if (!isAdmin) {
      alert("Permission denied. Only ADMIN can process dispatches.");
      return;
    }

    setActionLoading(true);
    try {
      const res = await api.salesOrders.dispatch(selectedOrder.id, {
        tracking_number: trackingNumber || undefined,
        notes: dispatchNotes || undefined
      });
      alert(res.message);
      setDispatchModal(false);
      setTrackingNumber("");
      setDispatchNotes("");
      await loadOrders();
      viewOrder(selectedOrder.id);
    } catch (err: any) {
      alert(`Dispatch Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredOrders = orders.filter(o =>
    o.order_number.toLowerCase().includes(search.toLowerCase()) ||
    (o.customer_name && o.customer_name.toLowerCase().includes(search.toLowerCase())) ||
    (o.quotation_number && o.quotation_number.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Action Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Sales Orders & Fulfillment</h2>
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "4px 0 0" }}>
            Track order confirmation, inventory reservation (Physical stock intact), and dispatch operations.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="source-card" style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
        <Search size={16} color="var(--text-muted)" />
        <input
          type="text"
          placeholder="Search by Order #, Quotation #, or Customer..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ background: "transparent", border: "none", outline: "none", color: "var(--text)", width: "100%", fontSize: 13 }}
        />
      </div>

      {/* Orders Table */}
      <div className="source-card" style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, textAlign: "left" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)", background: "rgba(255,255,255,0.02)", color: "var(--text-muted)", fontSize: 11, textTransform: "uppercase" }}>
              <th style={{ padding: "12px 16px" }}>Order #</th>
              <th style={{ padding: "12px 16px" }}>Quotation & Enquiry</th>
              <th style={{ padding: "12px 16px" }}>Customer</th>
              <th style={{ padding: "12px 16px" }}>Order Status</th>
              <th style={{ padding: "12px 16px" }}>Total Amount</th>
              <th style={{ padding: "12px 16px" }}>Confirmed By</th>
              <th style={{ padding: "12px 16px" }}>Dispatched</th>
              <th style={{ padding: "12px 16px", textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ padding: 32, textAlign: "center", color: "var(--text-muted)" }}>Loading sales orders...</td></tr>
            ) : filteredOrders.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: 32, textAlign: "center", color: "var(--text-muted)" }}>No sales orders generated yet. Convert an ACCEPTED quotation to create an order.</td></tr>
            ) : (
              filteredOrders.map(ord => (
                <tr key={ord.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "12px 16px", fontWeight: 700, color: "var(--accent)" }}>{ord.order_number}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{ord.quotation_number}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{ord.enquiry_number}</div>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ fontWeight: 600 }}>{ord.customer_name}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{ord.customer_company}</div>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{
                      padding: "3px 8px", borderRadius: 12, fontSize: 11, fontWeight: 700,
                      background: ord.status === "DISPATCHED" ? "rgba(34,197,94,0.15)" :
                                  ord.status === "CONFIRMED" ? "rgba(0,123,255,0.15)" :
                                  ord.status === "PENDING" ? "rgba(234,179,8,0.15)" : "rgba(100,100,100,0.15)",
                      color: ord.status === "DISPATCHED" ? "var(--green)" :
                             ord.status === "CONFIRMED" ? "var(--accent)" :
                             ord.status === "PENDING" ? "var(--warning)" : "var(--text-muted)"
                    }}>
                      {ord.status}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", fontWeight: 700 }}>₹{ord.total_amount.toLocaleString("en-IN")}</td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: "var(--text-muted)" }}>
                    {ord.confirmed_by_name || "—"}
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: "var(--text-muted)" }}>
                    {ord.dispatched_at ? new Date(ord.dispatched_at).toLocaleDateString("en-IN") : "—"}
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "right" }}>
                    <button
                      onClick={() => viewOrder(ord.id)}
                      className="btn btn-sm btn-ghost"
                      style={{ padding: "4px 8px", fontSize: 12 }}
                    >
                      <Eye size={13} style={{ marginRight: 4 }} /> View / Fulfill
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Sales Order Detail & Fulfillment Modal */}
      {selectedOrder && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
          <div className="source-card" style={{ width: "100%", maxWidth: 740, maxHeight: "90vh", overflowY: "auto", padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <span style={{ fontSize: 11, textTransform: "uppercase", color: "var(--accent)", fontWeight: 700 }}>Sales Order Management</span>
                <h3 style={{ fontSize: 18, fontWeight: 700, margin: "2px 0 0" }}>{selectedOrder.order_number}</h3>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  Originating Quotation: <strong>{selectedOrder.quotation_number}</strong> | Enquiry: <strong>{selectedOrder.enquiry_number}</strong>
                </span>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="btn btn-sm btn-ghost">✕</button>
            </div>

            {/* Workflow Guidance Banner */}
            <div style={{
              background: selectedOrder.status === "DISPATCHED" ? "rgba(34,197,94,0.1)" :
                          selectedOrder.status === "CONFIRMED" ? "rgba(0,123,255,0.1)" : "rgba(234,179,8,0.1)",
              border: `1px solid ${selectedOrder.status === "DISPATCHED" ? "rgba(34,197,94,0.3)" :
                                   selectedOrder.status === "CONFIRMED" ? "rgba(0,123,255,0.3)" : "rgba(234,179,8,0.3)"}`,
              borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, fontSize: 12
            }}>
              {selectedOrder.status === "PENDING" && (
                <>
                  <Clock size={16} color="var(--warning)" />
                  <div>
                    <strong>Order Status: PENDING CONFIRMATION.</strong> Stock has not yet been reserved.
                    {isAdmin ? " As ADMIN, click 'Confirm Order & Reserve Stock' below to allocate inventory." : " Waiting for Admin confirmation to reserve inventory."}
                  </div>
                </>
              )}
              {selectedOrder.status === "CONFIRMED" && (
                <>
                  <CheckCircle size={16} color="var(--accent)" />
                  <div>
                    <strong>Order Status: CONFIRMED.</strong> Required inventory is <strong>RESERVED</strong> (Physical quantity unchanged). Ready for dispatch.
                  </div>
                </>
              )}
              {selectedOrder.status === "DISPATCHED" && (
                <>
                  <Truck size={16} color="var(--green)" />
                  <div>
                    <strong>Order Status: DISPATCHED.</strong> Dispatched by {selectedOrder.dispatched_by_name} on {new Date(selectedOrder.dispatched_at!).toLocaleString("en-IN")}.
                    {selectedOrder.dispatch_tracking_number && ` Tracking #: ${selectedOrder.dispatch_tracking_number}`}. Physical & reserved stock deducted.
                  </div>
                </>
              )}
            </div>

            {/* Customer & Traceability */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, background: "rgba(255,255,255,0.02)", padding: 12, borderRadius: 8 }}>
              <div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Customer / Recipient</div>
                <div style={{ fontWeight: 600 }}>{selectedOrder.customer_name}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{selectedOrder.customer_company}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{selectedOrder.customer_address}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Order Financial Total</div>
                <div style={{ fontWeight: 700, fontSize: 16, color: "var(--accent)" }}>₹{selectedOrder.total_amount.toLocaleString("en-IN")}</div>
                {selectedOrder.confirmed_by_name && (
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                    Confirmed by: {selectedOrder.confirmed_by_name} ({new Date(selectedOrder.confirmed_at!).toLocaleDateString("en-IN")})
                  </div>
                )}
              </div>
            </div>

            {/* Crucial Case Study Section: Inventory & Stock Availability Breakdown */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <h4 style={{ fontSize: 13, textTransform: "uppercase", fontWeight: 700, margin: 0 }}>
                  Ordered Items & Inventory Availability
                </h4>
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                  Available = Physical Quantity − Reserved Quantity
                </span>
              </div>

              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--text-muted)", textAlign: "left" }}>
                    <th style={{ padding: "6px 0" }}>Product</th>
                    <th style={{ padding: "6px 0" }}>Order Qty</th>
                    <th style={{ padding: "6px 0" }}>Physical Stock</th>
                    <th style={{ padding: "6px 0" }}>Reserved Stock</th>
                    <th style={{ padding: "6px 0" }}>Available Stock</th>
                    <th style={{ padding: "6px 0" }}>Fulfillment Check</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items?.map(it => (
                    <tr key={it.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "8px 0" }}>
                        <div style={{ fontWeight: 600 }}>{it.product_name}</div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{it.sku}</div>
                      </td>
                      <td style={{ padding: "8px 0", fontWeight: 700 }}>{it.quantity} units</td>
                      <td style={{ padding: "8px 0" }}>{it.physical_quantity}</td>
                      <td style={{ padding: "8px 0", color: "var(--warning)" }}>{it.reserved_quantity}</td>
                      <td style={{ padding: "8px 0", fontWeight: 700, color: it.available_quantity >= it.quantity ? "var(--green)" : "var(--error)" }}>
                        {it.available_quantity}
                      </td>
                      <td style={{ padding: "8px 0" }}>
                        {selectedOrder.status !== "PENDING" ? (
                          <span style={{ color: "var(--green)", fontSize: 11, fontWeight: 700 }}>✓ Allocated</span>
                        ) : it.available_quantity >= it.quantity ? (
                          <span style={{ color: "var(--green)", fontSize: 11, fontWeight: 700 }}>✓ Stock Available</span>
                        ) : (
                          <span style={{ color: "var(--error)", fontSize: 11, fontWeight: 700 }}>✗ Insufficient Stock</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Inventory Audit Trail */}
            {selectedOrder.auditLogs && selectedOrder.auditLogs.length > 0 && (
              <div style={{ background: "rgba(255,255,255,0.01)", padding: 10, borderRadius: 8, fontSize: 11 }}>
                <span style={{ textTransform: "uppercase", fontWeight: 700, color: "var(--text-muted)" }}>Stock Transaction Audit Log</span>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 6 }}>
                  {selectedOrder.auditLogs.map(log => (
                    <div key={log.id} style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)" }}>
                      <span><strong>{log.transaction_type}</strong>: {log.quantity} units of {log.sku} (Physical: {log.previous_physical} → {log.new_physical}, Reserved: {log.previous_reserved} → {log.new_reserved})</span>
                      <span>by {log.user_name} at {new Date(log.created_at).toLocaleTimeString("en-IN")}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Admin Action Buttons */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, borderTop: "1px solid var(--border)", paddingTop: 14 }}>
              {selectedOrder.status === "PENDING" && (
                <>
                  {!isAdmin && (
                    <span style={{ fontSize: 12, color: "var(--text-muted)", alignSelf: "center" }}>
                      * Only ADMIN role can confirm orders and reserve stock.
                    </span>
                  )}
                  <button
                    onClick={() => handleConfirmOrder(selectedOrder.id)}
                    disabled={actionLoading || !isAdmin}
                    className="btn btn-primary"
                    style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, opacity: isAdmin ? 1 : 0.5 }}
                    title={isAdmin ? "Reserve stock in inventory" : "Admin access required"}
                  >
                    <Check size={14} /> Confirm Order & Reserve Stock
                  </button>
                </>
              )}

              {selectedOrder.status === "CONFIRMED" && (
                <>
                  {!isAdmin && (
                    <span style={{ fontSize: 12, color: "var(--text-muted)", alignSelf: "center" }}>
                      * Only ADMIN role can execute dispatch.
                    </span>
                  )}
                  <button
                    onClick={() => setDispatchModal(true)}
                    disabled={actionLoading || !isAdmin}
                    className="btn btn-primary"
                    style={{ background: "var(--green)", borderColor: "var(--green)", display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, opacity: isAdmin ? 1 : 0.5 }}
                  >
                    <Truck size={14} /> Process Dispatch
                  </button>
                </>
              )}

              {selectedOrder.status === "DISPATCHED" && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--green)", fontSize: 12, fontWeight: 700 }}>
                  <CheckCircle size={16} /> Fully Dispatched & Inventory Deducted
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Dispatch Modal */}
      {dispatchModal && selectedOrder && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100, padding: 16 }}>
          <div className="source-card" style={{ width: "100%", maxWidth: 460, padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Confirm Dispatch</h3>
            <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
              Dispatching order <strong>{selectedOrder.order_number}</strong> will permanently deduct physical and reserved stock from warehouse inventory.
            </p>

            <form onSubmit={handleDispatchOrder} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>Tracking Number</label>
                <input
                  type="text"
                  placeholder="e.g. TRK-BLR-2026-9921"
                  value={trackingNumber}
                  onChange={e => setTrackingNumber(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 8, background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)", fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>Dispatch Notes / Carrier</label>
                <textarea
                  rows={2}
                  placeholder="Carrier name, vehicle number, loading dock..."
                  value={dispatchNotes}
                  onChange={e => setDispatchNotes(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 8, background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)", fontSize: 13 }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
                <button type="button" onClick={() => setDispatchModal(false)} className="btn btn-ghost">Cancel</button>
                <button type="submit" disabled={actionLoading} className="btn btn-primary" style={{ background: "var(--green)", borderColor: "var(--green)" }}>
                  {actionLoading ? "Processing Dispatch..." : "Confirm & Dispatch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

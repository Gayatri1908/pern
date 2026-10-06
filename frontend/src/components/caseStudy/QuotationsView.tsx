"use client";
import React, { useState, useEffect } from "react";
import { Plus, Search, Send, CheckCircle2, XCircle, ShoppingBag, Eye, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";
import type { Quotation, Enquiry, Product, User } from "@/types";

interface QuotationsViewProps {
  user: User;
  initialEnquiryId?: string | null;
  onNavigateToOrder?: (orderId: string) => void;
}

export function QuotationsView({ user, initialEnquiryId, onNavigateToOrder }: QuotationsViewProps) {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Quotation Form State
  const [selectedEnquiryId, setSelectedEnquiryId] = useState<string>("");
  const [discountPct, setDiscountPct] = useState<number>(0);
  const [gstRatePct, setGstRatePct] = useState<number>(18);
  const [validUntil, setValidUntil] = useState<string>("");
  const [items, setItems] = useState<Array<{ product_id: string; quantity: number; unit_price: number }>>([]);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [quoRes, enqRes, prodRes] = await Promise.all([
        api.quotations.list(),
        api.enquiries.list(),
        api.products.list()
      ]);
      setQuotations(quoRes.data || []);
      setEnquiries(enqRes.data || []);
      setProducts(prodRes.data || []);

      if (initialEnquiryId) {
        handleSelectEnquiryForQuotation(initialEnquiryId, enqRes.data || [], prodRes.data || []);
        setShowCreateModal(true);
      }
    } catch (err: any) {
      alert(err.message || "Failed to load quotations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [initialEnquiryId]);

  const handleSelectEnquiryForQuotation = async (enqId: string, currentEnquiries = enquiries, currentProducts = products) => {
    setSelectedEnquiryId(enqId);
    try {
      const enqDetails = await api.enquiries.get(enqId);
      if (enqDetails.data?.items && enqDetails.data.items.length > 0) {
        setItems(enqDetails.data.items.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.list_price || 0
        })));
      } else {
        setItems([{ product_id: currentProducts[0]?.id || "", quantity: 1, unit_price: currentProducts[0]?.unit_price || 0 }]);
      }
    } catch {
      // fallback
    }
  };

  const viewDetails = async (id: string) => {
    try {
      const res = await api.quotations.get(id);
      setSelectedQuotation(res.data);
    } catch (err: any) {
      alert(err.message || "Failed to fetch quotation details");
    }
  };

  // Calculations
  const calculatedSubtotal = items.reduce((acc, it) => acc + (it.quantity * it.unit_price), 0);
  const calculatedDiscount = (calculatedSubtotal * discountPct) / 100;
  const calculatedTaxable = calculatedSubtotal - calculatedDiscount;
  const calculatedGst = (calculatedTaxable * gstRatePct) / 100;
  const calculatedTotal = calculatedTaxable + calculatedGst;

  const handleCreateQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEnquiryId) {
      alert("Please select an enquiry.");
      return;
    }
    const validItems = items.filter(i => i.product_id && i.quantity > 0 && i.unit_price >= 0);
    if (validItems.length === 0) {
      alert("Please add at least one line item.");
      return;
    }

    setSubmitting(true);
    try {
      await api.quotations.create({
        enquiry_id: selectedEnquiryId,
        discount_pct: Number(discountPct),
        gst_rate_pct: Number(gstRatePct),
        valid_until: validUntil || undefined,
        items: validItems
      });
      setShowCreateModal(false);
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to create quotation");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendQuotation = async (id: string) => {
    try {
      await api.quotations.send(id);
      await loadData();
      if (selectedQuotation?.id === id) viewDetails(id);
    } catch (err: any) {
      alert(err.message || "Failed to send quotation");
    }
  };

  const handleDecideQuotation = async (id: string, decision: "ACCEPTED" | "REJECTED") => {
    try {
      await api.quotations.decide(id, decision);
      await loadData();
      if (selectedQuotation?.id === id) viewDetails(id);
    } catch (err: any) {
      alert(err.message || "Failed to update quotation");
    }
  };

  const handleConvertToSalesOrder = async (id: string) => {
    try {
      const res = await api.quotations.convertToOrder(id);
      alert(`Success! Sales Order ${res.data.order_number} created in PENDING status.`);
      setSelectedQuotation(null);
      await loadData();
      if (onNavigateToOrder) {
        onNavigateToOrder(res.data.id);
      }
    } catch (err: any) {
      alert(err.message || "Failed to convert quotation to Sales Order");
    }
  };

  const filteredQuotations = quotations.filter(q =>
    q.quotation_number.toLowerCase().includes(search.toLowerCase()) ||
    (q.customer_name && q.customer_name.toLowerCase().includes(search.toLowerCase())) ||
    (q.enquiry_number && q.enquiry_number.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Commercial Quotations</h2>
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "4px 0 0" }}>
            Generate quotes from enquiries with discount and GST. Only ACCEPTED quotes can be converted to Sales Orders.
          </p>
        </div>
        <button
          onClick={() => {
            if (enquiries.length > 0 && !selectedEnquiryId) {
              handleSelectEnquiryForQuotation(enquiries[0].id);
            }
            setShowCreateModal(true);
          }}
          className="btn btn-primary"
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600 }}
        >
          <Plus size={16} /> Create Quotation
        </button>
      </div>

      {/* Filter Bar */}
      <div className="source-card" style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
        <Search size={16} color="var(--text-muted)" />
        <input
          type="text"
          placeholder="Search by Quotation #, Enquiry #, or Customer..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ background: "transparent", border: "none", outline: "none", color: "var(--text)", width: "100%", fontSize: 13 }}
        />
      </div>

      {/* Quotations Table */}
      <div className="source-card" style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, textAlign: "left" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)", background: "rgba(255,255,255,0.02)", color: "var(--text-muted)", fontSize: 11, textTransform: "uppercase" }}>
              <th style={{ padding: "12px 16px" }}>Quotation #</th>
              <th style={{ padding: "12px 16px" }}>Enquiry #</th>
              <th style={{ padding: "12px 16px" }}>Customer</th>
              <th style={{ padding: "12px 16px" }}>Status</th>
              <th style={{ padding: "12px 16px" }}>Subtotal</th>
              <th style={{ padding: "12px 16px" }}>Discount / GST</th>
              <th style={{ padding: "12px 16px" }}>Total Amount</th>
              <th style={{ padding: "12px 16px", textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ padding: 32, textAlign: "center", color: "var(--text-muted)" }}>Loading quotations...</td></tr>
            ) : filteredQuotations.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: 32, textAlign: "center", color: "var(--text-muted)" }}>No quotations found.</td></tr>
            ) : (
              filteredQuotations.map(quo => (
                <tr key={quo.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "12px 16px", fontWeight: 700, color: "var(--accent)" }}>{quo.quotation_number}</td>
                  <td style={{ padding: "12px 16px", fontFamily: "var(--font-mono)", fontSize: 12 }}>{quo.enquiry_number}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ fontWeight: 600 }}>{quo.customer_name}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{quo.customer_company}</div>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{
                      padding: "3px 8px", borderRadius: 12, fontSize: 11, fontWeight: 700,
                      background: quo.status === "ACCEPTED" ? "rgba(34,197,94,0.15)" :
                                  quo.status === "ORDERED" ? "rgba(0,123,255,0.15)" :
                                  quo.status === "REJECTED" ? "rgba(239,68,68,0.15)" :
                                  quo.status === "SENT" ? "rgba(234,179,8,0.15)" : "rgba(100,100,100,0.15)",
                      color: quo.status === "ACCEPTED" ? "var(--green)" :
                             quo.status === "ORDERED" ? "var(--accent)" :
                             quo.status === "REJECTED" ? "var(--error)" :
                             quo.status === "SENT" ? "var(--warning)" : "var(--text-muted)"
                    }}>
                      {quo.status}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>₹{quo.subtotal.toLocaleString("en-IN")}</td>
                  <td style={{ padding: "12px 16px", fontSize: 11, color: "var(--text-muted)" }}>
                    {quo.discount_pct}% off / {quo.gst_rate_pct}% GST
                  </td>
                  <td style={{ padding: "12px 16px", fontWeight: 700, color: "var(--text)" }}>
                    ₹{quo.total_amount.toLocaleString("en-IN")}
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "right" }}>
                    <button
                      onClick={() => viewDetails(quo.id)}
                      className="btn btn-sm btn-ghost"
                      style={{ padding: "4px 8px", fontSize: 12 }}
                    >
                      <Eye size={13} style={{ marginRight: 4 }} /> View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Quotation Detail Modal */}
      {selectedQuotation && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
          <div className="source-card" style={{ width: "100%", maxWidth: 680, maxHeight: "90vh", overflowY: "auto", padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <span style={{ fontSize: 11, textTransform: "uppercase", color: "var(--accent)", fontWeight: 700 }}>Commercial Quotation</span>
                <h3 style={{ fontSize: 18, fontWeight: 700, margin: "2px 0 0" }}>{selectedQuotation.quotation_number}</h3>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Linked to Enquiry: <strong>{selectedQuotation.enquiry_number}</strong></span>
              </div>
              <button onClick={() => setSelectedQuotation(null)} className="btn btn-sm btn-ghost">✕</button>
            </div>

            {/* Status Alert Banner */}
            {selectedQuotation.status === "ACCEPTED" && (
              <div style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--green)" }}>
                <CheckCircle2 size={16} />
                <span><strong>Quotation Accepted:</strong> Customer has approved this quote. You can now convert it into a Sales Order.</span>
              </div>
            )}
            {selectedQuotation.status === "ORDERED" && (
              <div style={{ background: "rgba(0,123,255,0.1)", border: "1px solid rgba(0,123,255,0.3)", borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--accent)" }}>
                <ShieldCheck size={16} />
                <span><strong>Converted to Sales Order:</strong> Order <strong>{selectedQuotation.sales_order_number}</strong> has been generated from this quotation.</span>
              </div>
            )}

            {/* Customer Details */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, background: "rgba(255,255,255,0.02)", padding: 12, borderRadius: 8 }}>
              <div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Customer / Company</div>
                <div style={{ fontWeight: 600 }}>{selectedQuotation.customer_name}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{selectedQuotation.customer_company}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{selectedQuotation.customer_email}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Quote Lifecycle Status</div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{selectedQuotation.status}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>Valid Until</div>
                <div style={{ fontSize: 12 }}>{selectedQuotation.valid_until ? new Date(selectedQuotation.valid_until).toLocaleDateString("en-IN") : "No expiry specified"}</div>
              </div>
            </div>

            {/* Items Breakdown */}
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--text-muted)", textAlign: "left" }}>
                  <th style={{ padding: "6px 0" }}>Product</th>
                  <th style={{ padding: "6px 0" }}>Qty</th>
                  <th style={{ padding: "6px 0" }}>Unit Price</th>
                  <th style={{ padding: "6px 0", textAlign: "right" }}>Line Total</th>
                </tr>
              </thead>
              <tbody>
                {selectedQuotation.items?.map(it => (
                  <tr key={it.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "8px 0" }}>
                      <div style={{ fontWeight: 600 }}>{it.product_name}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{it.sku} (Available stock: {it.available_quantity})</div>
                    </td>
                    <td style={{ padding: "8px 0" }}>{it.quantity}</td>
                    <td style={{ padding: "8px 0" }}>₹{it.unit_price.toLocaleString("en-IN")}</td>
                    <td style={{ padding: "8px 0", textAlign: "right", fontWeight: 600 }}>₹{it.line_total.toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Financial Summary */}
            <div style={{ alignSelf: "flex-end", width: 280, display: "flex", flexDirection: "column", gap: 6, fontSize: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>Subtotal:</span>
                <span>₹{selectedQuotation.subtotal.toLocaleString("en-IN")}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>Discount ({selectedQuotation.discount_pct}%):</span>
                <span style={{ color: "var(--green)" }}>- ₹{selectedQuotation.discount_amount.toLocaleString("en-IN")}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>GST ({selectedQuotation.gst_rate_pct}%):</span>
                <span>+ ₹{selectedQuotation.gst_amount.toLocaleString("en-IN")}</span>
              </div>
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: 6, display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 14 }}>
                <span>Final Quotation Total:</span>
                <span style={{ color: "var(--accent)" }}>₹{selectedQuotation.total_amount.toLocaleString("en-IN")}</span>
              </div>
            </div>

            {/* Lifecycle Action Buttons */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, borderTop: "1px solid var(--border)", paddingTop: 14, flexWrap: "wrap" }}>
              {selectedQuotation.status === "DRAFT" && (
                <button
                  onClick={() => handleSendQuotation(selectedQuotation.id)}
                  className="btn btn-primary"
                  style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}
                >
                  <Send size={14} /> Send Quotation to Customer
                </button>
              )}

              {selectedQuotation.status === "SENT" && (
                <>
                  <button
                    onClick={() => handleDecideQuotation(selectedQuotation.id, "REJECTED")}
                    className="btn btn-ghost"
                    style={{ color: "var(--error)", display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}
                  >
                    <XCircle size={14} /> Mark Rejected
                  </button>
                  <button
                    onClick={() => handleDecideQuotation(selectedQuotation.id, "ACCEPTED")}
                    className="btn btn-primary"
                    style={{ background: "var(--green)", borderColor: "var(--green)", display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}
                  >
                    <CheckCircle2 size={14} /> Mark Accepted
                  </button>
                </>
              )}

              {selectedQuotation.status === "ACCEPTED" && (
                <button
                  onClick={() => handleConvertToSalesOrder(selectedQuotation.id)}
                  className="btn btn-primary"
                  style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700 }}
                >
                  <ShoppingBag size={14} /> Convert to Sales Order
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Quotation Modal */}
      {showCreateModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
          <div className="source-card" style={{ width: "100%", maxWidth: 680, maxHeight: "90vh", overflowY: "auto", padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Create Commercial Quotation</h3>
              <button onClick={() => setShowCreateModal(false)} className="btn btn-sm btn-ghost">✕</button>
            </div>

            <form onSubmit={handleCreateQuotation} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>Select Source Enquiry *</label>
                <select
                  value={selectedEnquiryId}
                  onChange={e => handleSelectEnquiryForQuotation(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 8, background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}
                  required
                >
                  <option value="">-- Choose Enquiry --</option>
                  {enquiries.map(enq => (
                    <option key={enq.id} value={enq.id}>
                      {enq.enquiry_number} — {enq.customer_name} ({enq.customer_company})
                    </option>
                  ))}
                </select>
              </div>

              {/* Quotation Line Items */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 6 }}>Quotation Products & Pricing *</label>
                {items.map((it, idx) => (
                  <div key={idx} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                    <select
                      value={it.product_id}
                      onChange={e => {
                        const pid = e.target.value;
                        const prd = products.find(p => p.id === pid);
                        setItems(prev => prev.map((item, i) => i === idx ? { ...item, product_id: pid, unit_price: prd?.unit_price || item.unit_price } : item));
                      }}
                      style={{ flex: 3, padding: "8px 10px", borderRadius: 8, background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)", fontSize: 12 }}
                      required
                    >
                      <option value="">-- Choose Product --</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                      ))}
                    </select>

                    <input
                      type="number"
                      min={1}
                      placeholder="Qty"
                      value={it.quantity}
                      onChange={e => {
                        const val = parseInt(e.target.value) || 1;
                        setItems(prev => prev.map((item, i) => i === idx ? { ...item, quantity: val } : item));
                      }}
                      style={{ width: 70, padding: "8px 10px", borderRadius: 8, background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)", fontSize: 12 }}
                      required
                    />

                    <input
                      type="number"
                      min={0}
                      placeholder="Unit Price"
                      value={it.unit_price}
                      onChange={e => {
                        const val = parseFloat(e.target.value) || 0;
                        setItems(prev => prev.map((item, i) => i === idx ? { ...item, unit_price: val } : item));
                      }}
                      style={{ width: 120, padding: "8px 10px", borderRadius: 8, background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)", fontSize: 12 }}
                      required
                    />

                    <div style={{ width: 100, textAlign: "right", fontSize: 12, fontWeight: 600 }}>
                      ₹{(it.quantity * it.unit_price).toLocaleString("en-IN")}
                    </div>
                  </div>
                ))}
              </div>

              {/* Discount & Tax Parameters */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>Discount (%):</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={discountPct}
                    onChange={e => setDiscountPct(parseFloat(e.target.value) || 0)}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 8, background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)", fontSize: 12 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>GST Rate (%):</label>
                  <input
                    type="number"
                    min={0}
                    max={28}
                    value={gstRatePct}
                    onChange={e => setGstRatePct(parseFloat(e.target.value) || 0)}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 8, background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)", fontSize: 12 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>Valid Until:</label>
                  <input
                    type="date"
                    value={validUntil}
                    onChange={e => setValidUntil(e.target.value)}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 8, background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)", fontSize: 12 }}
                  />
                </div>
              </div>

              {/* Live Quotation Summary Calculation */}
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)", borderRadius: 8, padding: 12, display: "flex", flexDirection: "column", gap: 6, fontSize: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)" }}>Subtotal:</span>
                  <span>₹{calculatedSubtotal.toLocaleString("en-IN")}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)" }}>Discount ({discountPct}%):</span>
                  <span style={{ color: "var(--green)" }}>- ₹{calculatedDiscount.toLocaleString("en-IN")}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)" }}>Taxable Amount:</span>
                  <span>₹{calculatedTaxable.toLocaleString("en-IN")}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)" }}>GST ({gstRatePct}%):</span>
                  <span>+ ₹{calculatedGst.toLocaleString("en-IN")}</span>
                </div>
                <div style={{ borderTop: "1px solid var(--border)", paddingTop: 6, display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 14 }}>
                  <span>Calculated Quotation Total:</span>
                  <span style={{ color: "var(--accent)" }}>₹{calculatedTotal.toLocaleString("en-IN")}</span>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-ghost">Cancel</button>
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  {submitting ? "Calculating & Saving..." : "Generate Quotation (Draft)"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

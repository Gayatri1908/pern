"use client";
import React, { useState, useEffect } from "react";
import { Plus, Search, Eye, ArrowRight, FileText, CheckCircle, Clock } from "lucide-react";
import { api } from "@/lib/api";
import type { Enquiry, Customer, Product, User } from "@/types";

interface EnquiriesViewProps {
  user: User;
  onNavigateToQuotationCreate?: (enquiryId: string) => void;
}

export function EnquiriesView({ user, onNavigateToQuotationCreate }: EnquiriesViewProps) {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Enquiry Form State
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<Array<{ product_id: string; quantity: number; target_price?: number; notes?: string }>>([
    { product_id: "", quantity: 1 }
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [enqRes, custRes, prodRes] = await Promise.all([
        api.enquiries.list(),
        api.customers.list(),
        api.products.list()
      ]);
      setEnquiries(enqRes.data || []);
      setCustomers(custRes.data || []);
      setProducts(prodRes.data || []);
      if (!selectedCustomer && custRes.data?.length > 0) {
        setSelectedCustomer(custRes.data[0].id);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load enquiries");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const viewDetails = async (id: string) => {
    try {
      const res = await api.enquiries.get(id);
      setSelectedEnquiry(res.data);
    } catch (err: any) {
      alert(err.message || "Failed to fetch enquiry details");
    }
  };

  const addItemRow = () => {
    setItems(prev => [...prev, { product_id: products[0]?.id || "", quantity: 1 }]);
  };

  const removeItemRow = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreateEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) {
      alert("Please select a customer.");
      return;
    }
    const validItems = items.filter(i => i.product_id && i.quantity > 0);
    if (validItems.length === 0) {
      alert("Please select at least one product with quantity > 0.");
      return;
    }

    setSubmitting(true);
    try {
      await api.enquiries.create({
        customer_id: selectedCustomer,
        notes,
        items: validItems
      });
      setShowCreateModal(false);
      setNotes("");
      setItems([{ product_id: products[0]?.id || "", quantity: 1 }]);
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to create enquiry.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredEnquiries = enquiries.filter(e =>
    e.enquiry_number.toLowerCase().includes(search.toLowerCase()) ||
    (e.customer_name && e.customer_name.toLowerCase().includes(search.toLowerCase())) ||
    (e.customer_company && e.customer_company.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Action Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Customer Enquiries</h2>
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "4px 0 0" }}>
            Record and track client product requirements before issuing quotations.
          </p>
        </div>
        <button
          onClick={() => {
            if (products.length > 0 && !items[0].product_id) {
              setItems([{ product_id: products[0].id, quantity: 1 }]);
            }
            setShowCreateModal(true);
          }}
          className="btn btn-primary"
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600 }}
        >
          <Plus size={16} /> New Enquiry
        </button>
      </div>

      {/* Filter Bar */}
      <div className="source-card" style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
        <Search size={16} color="var(--text-muted)" />
        <input
          type="text"
          placeholder="Search by Enquiry #, Customer, or Company..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ background: "transparent", border: "none", outline: "none", color: "var(--text)", width: "100%", fontSize: 13 }}
        />
      </div>

      {/* Enquiries Table */}
      <div className="source-card" style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, textAlign: "left" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)", background: "rgba(255,255,255,0.02)", color: "var(--text-muted)", fontSize: 11, textTransform: "uppercase" }}>
              <th style={{ padding: "12px 16px" }}>Enquiry #</th>
              <th style={{ padding: "12px 16px" }}>Customer & Company</th>
              <th style={{ padding: "12px 16px" }}>Status</th>
              <th style={{ padding: "12px 16px" }}>Products / Items</th>
              <th style={{ padding: "12px 16px" }}>Created By</th>
              <th style={{ padding: "12px 16px" }}>Date</th>
              <th style={{ padding: "12px 16px", textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ padding: 32, textAlign: "center", color: "var(--text-muted)" }}>Loading enquiries...</td></tr>
            ) : filteredEnquiries.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: 32, textAlign: "center", color: "var(--text-muted)" }}>No enquiries found. Click "+ New Enquiry" to create one.</td></tr>
            ) : (
              filteredEnquiries.map(enq => (
                <tr key={enq.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "12px 16px", fontWeight: 700, color: "var(--accent)" }}>{enq.enquiry_number}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ fontWeight: 600 }}>{enq.customer_name}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{enq.customer_company}</div>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{
                      padding: "3px 8px", borderRadius: 12, fontSize: 11, fontWeight: 700,
                      background: enq.status === "NEW" ? "rgba(0,123,255,0.15)" : enq.status === "QUOTED" ? "rgba(34,197,94,0.15)" : "rgba(100,100,100,0.15)",
                      color: enq.status === "NEW" ? "var(--accent)" : enq.status === "QUOTED" ? "var(--green)" : "var(--text-muted)"
                    }}>
                      {enq.status}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    {enq.item_count} items ({enq.total_units} total units)
                  </td>
                  <td style={{ padding: "12px 16px", color: "var(--text-muted)" }}>{enq.created_by_name}</td>
                  <td style={{ padding: "12px 16px", color: "var(--text-muted)", fontSize: 12 }}>
                    {new Date(enq.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "right" }}>
                    <button
                      onClick={() => viewDetails(enq.id)}
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

      {/* Detail Modal */}
      {selectedEnquiry && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
          <div className="source-card" style={{ width: "100%", maxWidth: 650, maxHeight: "90vh", overflowY: "auto", padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <span style={{ fontSize: 11, textTransform: "uppercase", color: "var(--accent)", fontWeight: 700 }}>Enquiry Details</span>
                <h3 style={{ fontSize: 18, fontWeight: 700, margin: "2px 0 0" }}>{selectedEnquiry.enquiry_number}</h3>
              </div>
              <button onClick={() => setSelectedEnquiry(null)} className="btn btn-sm btn-ghost">✕</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, background: "rgba(255,255,255,0.02)", padding: 12, borderRadius: 8 }}>
              <div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Customer</div>
                <div style={{ fontWeight: 600 }}>{selectedEnquiry.customer_name}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{selectedEnquiry.customer_company}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{selectedEnquiry.customer_email}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Status</div>
                <div style={{ fontWeight: 700, color: selectedEnquiry.status === "QUOTED" ? "var(--green)" : "var(--accent)" }}>{selectedEnquiry.status}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>Notes</div>
                <div style={{ fontSize: 12 }}>{selectedEnquiry.notes || "None"}</div>
              </div>
            </div>

            <h4 style={{ fontSize: 13, textTransform: "uppercase", fontWeight: 700, margin: "8px 0 0" }}>Requested Products</h4>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--text-muted)", textAlign: "left" }}>
                  <th style={{ padding: "6px 0" }}>Product</th>
                  <th style={{ padding: "6px 0" }}>Quantity</th>
                  <th style={{ padding: "6px 0" }}>List Price</th>
                  <th style={{ padding: "6px 0" }}>Available Stock</th>
                </tr>
              </thead>
              <tbody>
                {selectedEnquiry.items?.map(item => (
                  <tr key={item.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "8px 0" }}>
                      <div style={{ fontWeight: 600 }}>{item.product_name}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{item.sku}</div>
                    </td>
                    <td style={{ padding: "8px 0", fontWeight: 700 }}>{item.quantity} units</td>
                    <td style={{ padding: "8px 0" }}>₹{(item.list_price || 0).toLocaleString("en-IN")}</td>
                    <td style={{ padding: "8px 0" }}>
                      <span style={{ color: (item.available_quantity || 0) >= item.quantity ? "var(--green)" : "var(--warning)" }}>
                        {item.available_quantity} available
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
              {onNavigateToQuotationCreate && (
                <button
                  onClick={() => {
                    const enqId = selectedEnquiry.id;
                    setSelectedEnquiry(null);
                    onNavigateToQuotationCreate(enqId);
                  }}
                  className="btn btn-primary"
                  style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}
                >
                  <ArrowRight size={14} /> Create Quotation From This Enquiry
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Enquiry Modal */}
      {showCreateModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
          <div className="source-card" style={{ width: "100%", maxWidth: 640, maxHeight: "90vh", overflowY: "auto", padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Create New Enquiry</h3>
              <button onClick={() => setShowCreateModal(false)} className="btn btn-sm btn-ghost">✕</button>
            </div>

            <form onSubmit={handleCreateEnquiry} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>Select Customer *</label>
                <select
                  value={selectedCustomer}
                  onChange={e => setSelectedCustomer(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 8, background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}
                  required
                >
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} — {c.company}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>Enquiry Notes / Requirements</label>
                <textarea
                  rows={2}
                  placeholder="Enter client project requirements, location, target delivery date..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 8, background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}
                />
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>Enquiry Products *</label>
                  <button type="button" onClick={addItemRow} className="btn btn-sm btn-ghost" style={{ fontSize: 11, color: "var(--accent)" }}>
                    + Add Product
                  </button>
                </div>

                {items.map((it, idx) => (
                  <div key={idx} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                    <select
                      value={it.product_id}
                      onChange={e => {
                        const val = e.target.value;
                        setItems(prev => prev.map((item, i) => i === idx ? { ...item, product_id: val } : item));
                      }}
                      style={{ flex: 3, padding: "8px 10px", borderRadius: 8, background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)", fontSize: 12 }}
                      required
                    >
                      <option value="">-- Choose Product --</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} (Stock: {p.available_quantity} avail) — ₹{p.unit_price.toLocaleString("en-IN")}
                        </option>
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
                      style={{ width: 80, padding: "8px 10px", borderRadius: 8, background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)", fontSize: 12 }}
                      required
                    />

                    {items.length > 1 && (
                      <button type="button" onClick={() => removeItemRow(idx)} className="btn btn-sm btn-ghost" style={{ color: "var(--error)" }}>
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-ghost">Cancel</button>
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  {submitting ? "Saving..." : "Create Enquiry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

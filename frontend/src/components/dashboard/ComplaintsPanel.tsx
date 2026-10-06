"use client";
// ============================================================
// ComplaintsPanel — complaint submission and management
// Live auto-refresh every 10s, card-based layout, expandable
// ============================================================
import React, { useEffect, useState, useCallback, useRef } from "react";
import { Plus, RefreshCw, X, ChevronDown, ChevronRight, Clock, AlertTriangle, MessageSquare, Package } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { api } from "@/lib/api";
import type { Complaint, ComplaintStatus, ComplaintPriority, Product, UserRole } from "@/types";

interface Props { role: UserRole; products: Product[]; }

const CATEGORIES = ["performance", "hardware_fault", "connectivity", "billing", "installation", "other"];
const PRIORITIES: ComplaintPriority[] = ["low", "medium", "high", "urgent"];
const STATUSES: ComplaintStatus[] = ["open", "in_progress", "resolved", "closed"];

const POLL_INTERVAL_MS = 10_000; // live refresh every 10 seconds

export function ComplaintsPanel({ role, products }: Props) {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ product_id: "", category: "performance", description: "", priority: "medium" as ComplaintPriority });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus | "all">("all");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await api.complaints.list() as Complaint[];
      setComplaints(Array.isArray(data) ? data : []);
    } catch { setComplaints([]); }
    finally { if (!silent) setLoading(false); }
  }, []);

  // Initial load
  useEffect(() => { load(); }, [load]);

  // Live polling — refresh every 10s without showing loading spinner
  useEffect(() => {
    pollRef.current = setInterval(() => load(true), POLL_INTERVAL_MS);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [load]);

  // Auto-dismiss success/error messages
  useEffect(() => {
    if (success) { const t = setTimeout(() => setSuccess(null), 4000); return () => clearTimeout(t); }
  }, [success]);
  useEffect(() => {
    if (error) { const t = setTimeout(() => setError(null), 5000); return () => clearTimeout(t); }
  }, [error]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.product_id) { setError("Please select a product."); return; }
    setSubmitting(true); setError(null);
    try {
      await api.complaints.create(form);
      setSuccess("Complaint submitted. Our team will respond within 24 hours.");
      setShowForm(false);
      setForm({ product_id: "", category: "performance", description: "", priority: "medium" });
      load();
    } catch (e) { setError(String(e)); }
    finally { setSubmitting(false); }
  }

  async function updateStatus(id: string, status: ComplaintStatus) {
    try {
      await api.complaints.update(id, { status });
      setComplaints(prev => prev.map(c => c.id === id ? { ...c, status } : c));
    } catch (e) { setError(String(e)); }
  }

  const filtered = statusFilter === "all" ? complaints : complaints.filter(c => c.status === statusFilter);

  function getProductInfo(productId: string) {
    return products.find(p => p.id === productId);
  }

  function getCategoryIcon(cat: string) {
    switch (cat) {
      case "hardware_fault": return "🔧";
      case "connectivity": return "📡";
      case "billing": return "💳";
      case "installation": return "🏗️";
      case "performance": return "⚡";
      default: return "📋";
    }
  }

  function getTimeSince(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  }

  const statusCounts = {
    all: complaints.length,
    open: complaints.filter(c => c.status === "open").length,
    in_progress: complaints.filter(c => c.status === "in_progress").length,
    resolved: complaints.filter(c => c.status === "resolved").length,
    closed: complaints.filter(c => c.status === "closed").length,
  };

  return (
    <div className="animate-slide-up" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, letterSpacing: "0.04em", textTransform: "uppercase" }}>
            Complaint Management
          </h2>
          <p style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginTop: 2 }}>
            {complaints.length} total · <span style={{ color: "var(--accent)" }}>{statusCounts.open} open</span>
            {statusCounts.in_progress > 0 && <> · <span style={{ color: "var(--yellow, #eab308)" }}>{statusCounts.in_progress} in progress</span></>}
            <span style={{ opacity: 0.5, marginLeft: 8 }}>● Live</span>
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => load()} title="Refresh now">
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(v => !v)}>
            {showForm ? <X size={12} /> : <Plus size={12} />}
            {showForm ? "Cancel" : "New Complaint"}
          </button>
        </div>
      </div>

      {/* Alerts */}
      {(error || success) && (
        <div style={{
          background: error ? "rgba(229,72,77,0.1)" : "rgba(50,205,50,0.1)",
          border: `1px solid ${error ? "rgba(229,72,77,0.2)" : "rgba(50,205,50,0.2)"}`,
          borderRadius: 10, padding: "10px 14px",
          color: error ? "var(--error)" : "var(--green)", fontSize: 12,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <span>{error ?? success}</span>
          <button onClick={() => { setError(null); setSuccess(null); }} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit" }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* New Complaint Form */}
      {showForm && (
        <div className="source-card" style={{ padding: 20 }}>
          <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Submit New Complaint
          </p>
          <form onSubmit={submit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Product</label>
              <select className="source-input" value={form.product_id} onChange={e => setForm(f => ({ ...f, product_id: e.target.value }))}>
                <option value="">Select a product...</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.product_code} — {p.serial_number}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Category</label>
              <select className="source-input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Priority</label>
              <select className="source-input" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as ComplaintPriority }))}>
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Description</label>
              <textarea
                className="source-input"
                rows={4}
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Describe the issue in detail..."
                style={{ resize: "vertical" }}
              />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? <RefreshCw size={12} className="animate-spin" /> : <Plus size={12} />}
                Submit Complaint
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter Chips */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {(["all", ...STATUSES] as const).map(f => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            className={`btn btn-sm ${statusFilter === f ? "btn-primary" : "btn-ghost"}`}
          >
            {f === "all" ? "All" : f.replace(/_/g, " ")}
            <span style={{
              marginLeft: 4, fontSize: 9, opacity: 0.7,
              background: "rgba(255,255,255,0.1)", borderRadius: 999,
              padding: "1px 5px", fontFamily: "var(--font-mono)"
            }}>
              {statusCounts[f]}
            </span>
          </button>
        ))}
      </div>

      {/* Complaints List — Card-based layout */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="source-card" style={{
              padding: 20, height: 90,
              background: "rgba(255,255,255,0.02)",
              animation: "pulse-dot 1.4s ease infinite",
            }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="source-card" style={{ textAlign: "center", padding: "64px 24px", color: "var(--text-muted)" }}>
          <MessageSquare size={32} style={{ marginBottom: 12, opacity: 0.3 }} />
          <p style={{ fontSize: 13 }}>
            {statusFilter === "all" ? "No complaints filed." : `No ${statusFilter.replace(/_/g, " ")} complaints.`}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map(complaint => {
            const isExpanded = expandedId === complaint.id;
            const product = getProductInfo(complaint.product_id);
            return (
              <div
                key={complaint.id}
                className="source-card"
                style={{
                  overflow: "hidden",
                  transition: "all 200ms ease",
                  borderLeft: `3px solid ${
                    complaint.priority === "urgent" ? "var(--error)"
                    : complaint.priority === "high" ? "#f97316"
                    : complaint.priority === "medium" ? "#eab308"
                    : "var(--border)"
                  }`,
                }}
              >
                {/* Card Header — clickable to expand */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : complaint.id)}
                  style={{
                    padding: "14px 18px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    transition: "background 150ms ease",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  {/* Expand chevron */}
                  <span style={{ flexShrink: 0, color: "var(--text-muted)", transition: "transform 200ms ease", transform: isExpanded ? "rotate(0)" : "rotate(-90deg)" }}>
                    <ChevronDown size={14} />
                  </span>

                  {/* Category icon */}
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{getCategoryIcon(complaint.category)}</span>

                  {/* Main info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{
                        fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13,
                        textTransform: "capitalize", color: "var(--text)"
                      }}>
                        {complaint.category.replace(/_/g, " ")}
                      </span>
                      {product && (
                        <span style={{
                          fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--text-muted)",
                          background: "rgba(255,255,255,0.05)", padding: "2px 8px", borderRadius: 999,
                        }}>
                          <Package size={9} style={{ marginRight: 3, verticalAlign: "middle" }} />
                          {product.product_code}
                        </span>
                      )}
                    </div>
                    {complaint.description && (
                      <p style={{
                        fontSize: 11, color: "var(--text-secondary)", marginTop: 3,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        maxWidth: 500,
                      }}>
                        {complaint.description}
                      </p>
                    )}
                  </div>

                  {/* Badges & time */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    <StatusBadge status={complaint.priority} />
                    <StatusBadge status={complaint.status} />
                    <span style={{
                      fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--text-muted)",
                      whiteSpace: "nowrap",
                    }}>
                      <Clock size={9} style={{ marginRight: 3, verticalAlign: "middle" }} />
                      {getTimeSince(complaint.created_at)}
                    </span>
                  </div>
                </div>

                {/* Expanded Detail View */}
                {isExpanded && (
                  <div style={{
                    padding: "0 18px 18px",
                    borderTop: "1px solid var(--border)",
                    animation: "slideDown 200ms ease",
                  }}>
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                      gap: 16, marginTop: 16,
                    }}>
                      {/* Complaint Details */}
                      <div>
                        <p style={{ fontSize: 9, fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: 8 }}>
                          Complaint Details
                        </p>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          <InfoRow label="ID" value={complaint.id.slice(0, 8) + "..."} mono />
                          <InfoRow label="Category" value={complaint.category.replace(/_/g, " ")} />
                          <InfoRow label="Priority" value={<StatusBadge status={complaint.priority} />} />
                          <InfoRow label="Status" value={<StatusBadge status={complaint.status} />} />
                        </div>
                      </div>

                      {/* Product Info */}
                      <div>
                        <p style={{ fontSize: 9, fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: 8 }}>
                          Product Info
                        </p>
                        {product ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            <InfoRow label="Code" value={product.product_code} />
                            <InfoRow label="Serial" value={product.serial_number} mono />
                            <InfoRow label="Category" value={product.category.replace(/_/g, " ")} />
                            <InfoRow label="Status" value={<StatusBadge status={product.status as any} />} />
                          </div>
                        ) : (
                          <p style={{ fontSize: 11, color: "var(--text-muted)" }}>Product info unavailable</p>
                        )}
                      </div>

                      {/* Timeline */}
                      <div>
                        <p style={{ fontSize: 9, fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: 8 }}>
                          Timeline
                        </p>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          <InfoRow
                            label="Filed"
                            value={new Date(complaint.created_at).toLocaleString("en-IN", {
                              day: "2-digit", month: "short", year: "numeric",
                              hour: "2-digit", minute: "2-digit"
                            })}
                          />
                          <InfoRow
                            label="Updated"
                            value={new Date(complaint.updated_at).toLocaleString("en-IN", {
                              day: "2-digit", month: "short", year: "numeric",
                              hour: "2-digit", minute: "2-digit"
                            })}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Description (full) */}
                    {complaint.description && (
                      <div style={{ marginTop: 16 }}>
                        <p style={{ fontSize: 9, fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: 6 }}>
                          Description
                        </p>
                        <div style={{
                          background: "rgba(255,255,255,0.02)",
                          border: "1px solid var(--border)",
                          borderRadius: 8, padding: "12px 16px",
                          fontSize: 12, color: "var(--text-secondary)",
                          lineHeight: 1.6, whiteSpace: "pre-wrap",
                        }}>
                          {complaint.description}
                        </div>
                      </div>
                    )}

                    {/* Admin: Status Update */}
                    {role === "Admin" && (
                      <div style={{
                        marginTop: 16, padding: "12px 16px",
                        background: "rgba(0,123,255,0.04)",
                        border: "1px solid rgba(0,123,255,0.1)",
                        borderRadius: 8,
                        display: "flex", alignItems: "center", gap: 12,
                      }}>
                        <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", textTransform: "uppercase", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                          Update Status:
                        </span>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {STATUSES.map(s => (
                            <button
                              key={s}
                              onClick={() => updateStatus(complaint.id, s)}
                              className={`btn btn-sm ${complaint.status === s ? "btn-primary" : "btn-ghost"}`}
                              style={{ padding: "4px 10px", fontSize: 11, textTransform: "capitalize" }}
                            >
                              {s.replace(/_/g, " ")}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Small helper for key-value info rows in expanded details */
function InfoRow({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)", minWidth: 64, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {label}
      </span>
      <span style={{ fontSize: 12, color: "var(--text-secondary)", fontFamily: mono ? "var(--font-mono)" : "inherit" }}>
        {value}
      </span>
    </div>
  );
}

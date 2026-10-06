"use client";
// ============================================================
// RegistrationsPanel — product registration request management
// ============================================================
import React, { useEffect, useState, useCallback } from "react";
import { RefreshCw, CheckCircle, XCircle, Plus, X } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DataTable } from "@/components/ui/DataTable";
import { api } from "@/lib/api";
import type { RegistrationRequest, RegistrationStatus, UserRole } from "@/types";

interface Props { role: UserRole; }

export function RegistrationsPanel({ role }: Props) {
  const [requests, setRequests] = useState<RegistrationRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<RegistrationRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<RegistrationStatus | "all">("pending");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ serial_number: "", gps_lat: "", gps_lng: "" });
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filterStatus !== "all") params.status = filterStatus;
      const data = await api.registrations.list(params) as RegistrationRequest[];
      setRequests(Array.isArray(data) ? data : []);
    } catch (e) { setError(String(e)); }
    finally { setLoading(false); }
  }, [filterStatus]);

  useEffect(() => { load(); }, [load]);

  async function review(id: string, status: "approved" | "rejected") {
    try {
      await api.registrations.review(id, status);
      setSuccess(`Request ${status} successfully.`);
      setSelectedRequest(null);
      await load();
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) { setError(String(e)); }
  }

  async function submitRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!form.serial_number) { setError("Serial number is required."); return; }
    setSubmitting(true); setError(null);
    try {
      await api.registrations.create({
        serial_number: form.serial_number,
        gps_lat: form.gps_lat ? parseFloat(form.gps_lat) : undefined,
        gps_lng: form.gps_lng ? parseFloat(form.gps_lng) : undefined,
      });
      setSuccess("Registration request submitted! Admin will review within 24 hours.");
      setShowForm(false);
      setForm({ serial_number: "", gps_lat: "", gps_lng: "" });
      load();
    } catch (e) { setError(String(e)); }
    finally { setSubmitting(false); }
  }

  const columns = [
    { key: "request_type", label: "Request Type", sortable: true, render: (r: RegistrationRequest) => (
      <span style={{ fontFamily: "var(--font-mono)", color: "var(--blue)", textTransform: "capitalize" }}>{r.request_type || "Registration"}</span>
    )},
    { key: "details", label: "Details", render: (r: RegistrationRequest) => (
      <div>
        <div style={{ fontWeight: 600 }}>{r.details?.companyName || "N/A"}</div>
        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{r.details?.product_requested || "General"}</div>
      </div>
    )},
    { key: "serial_number", label: "Serial Number", sortable: true, render: (r: RegistrationRequest) => (
      <span style={{ fontFamily: "var(--font-mono)", color: "var(--text)" }}>{r.serial_number || "Pending Assignment"}</span>
    )},
    { key: "status", label: "Status", sortable: true, render: (r: RegistrationRequest) => <StatusBadge status={r.status} /> },
    { key: "created_at", label: "Submitted", sortable: true, render: (r: RegistrationRequest) => (
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>
        {new Date(r.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
      </span>
    )},
    ...(role === "Admin" ? [{
      key: "actions", label: "Decision",
      render: (r: RegistrationRequest) => r.status === "pending" ? (
        <div style={{ display: "flex", gap: 6 }}>
          <button className="btn btn-success btn-sm" onClick={e => { e.stopPropagation(); review(r.id, "approved"); }}>
            <CheckCircle size={11} /> Approve
          </button>
          <button className="btn btn-danger btn-sm" onClick={e => { e.stopPropagation(); review(r.id, "rejected"); }}>
            <XCircle size={11} /> Reject
          </button>
        </div>
      ) : <span style={{ color: "var(--text-muted)", fontSize: 11 }}>Reviewed</span>,
    }] : []),
  ];

  return (
    <>
      <div className="animate-slide-up" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={load}>
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {(error || success) && (
        <div style={{
          background: error ? "rgba(229,72,77,0.1)" : "rgba(50,205,50,0.1)",
          border: `1px solid ${error ? "rgba(229,72,77,0.2)" : "rgba(50,205,50,0.2)"}`,
          borderRadius: 10, padding: "10px 14px",
          color: error ? "var(--error)" : "var(--green)", fontSize: 12
        }}>
          {error ?? success}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", gap: 6 }}>
        {(["all", "pending", "approved", "rejected"] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s as RegistrationStatus | "all")}
            className={`btn btn-sm ${filterStatus === s ? "btn-primary" : "btn-ghost"}`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="source-card" style={{ overflow: "hidden" }}>
        <DataTable<RegistrationRequest>
          columns={columns}
          data={requests}
          keyFn={r => r.id}
          loading={loading}
          emptyMessage="No registration requests found."
          onRowClick={r => setSelectedRequest(r)}
        />
      </div>
    </div>

      {/* Details View Modal */}
      {selectedRequest && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center",
          justifyContent: "center", zIndex: 1000, padding: 20,
          backdropFilter: "blur(4px)"
        }} onClick={() => setSelectedRequest(null)}>
          <div className="source-card animate-slide-up" style={{
            background: "var(--bg-soft)", width: "100%", maxWidth: 650,
            maxHeight: "90vh", display: "flex", flexDirection: "column",
            overflow: "hidden"
          }} onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "20px 24px", borderBottom: "1px solid var(--border)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 20, textTransform: "capitalize", color: "var(--text)" }}>
                  {selectedRequest.request_type || "Registration"} Request Details
                </h3>
                <StatusBadge status={selectedRequest.status} />
              </div>
              <button className="btn btn-ghost btn-sm" style={{ padding: 6, borderRadius: "50%" }} onClick={() => setSelectedRequest(null)}>
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="scroll-panel" style={{ padding: 24, flex: 1, display: "flex", flexDirection: "column", gap: 24 }}>
              {/* Product Info */}
              <div>
                <h4 style={{ fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", marginBottom: 12 }}>
                  Requested Item
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 11, color: "var(--text-muted)" }}>Product Model</label>
                    <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text)" }}>{selectedRequest.details?.product_requested || "General Inquiry"}</div>
                  </div>
                  {selectedRequest.serial_number && (
                    <div>
                      <label style={{ fontSize: 11, color: "var(--text-muted)" }}>Serial Number</label>
                      <div style={{ fontSize: 14, fontWeight: 500, fontFamily: "var(--font-mono)", color: "var(--text)" }}>{selectedRequest.serial_number}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h4 style={{ fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", marginBottom: 12 }}>
                  Contact Information
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={{ fontSize: 11, color: "var(--text-muted)" }}>Company Name</label>
                    <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text)" }}>{selectedRequest.details?.companyName || "N/A"}</div>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: "var(--text-muted)" }}>Contact Person</label>
                    <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text)" }}>{selectedRequest.details?.contactPerson || "N/A"}</div>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 11, color: "var(--text-muted)" }}>Email Address</label>
                    <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text)" }}>{selectedRequest.details?.email || "N/A"}</div>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: "var(--text-muted)" }}>Phone Number</label>
                    <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text)" }}>{selectedRequest.details?.phone || "N/A"}</div>
                  </div>
                </div>
              </div>

              {/* Registration specific location */}
              {selectedRequest.request_type === "registration" && (
                <div>
                  <h4 style={{ fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", marginBottom: 12 }}>
                    Installation Site Details
                  </h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 16 }}>
                    <div>
                      <label style={{ fontSize: 11, color: "var(--text-muted)" }}>City</label>
                      <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text)" }}>{selectedRequest.details?.city || "N/A"}</div>
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: "var(--text-muted)" }}>State</label>
                      <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text)" }}>{selectedRequest.details?.state || "N/A"}</div>
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: "var(--text-muted)" }}>Country</label>
                      <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text)" }}>{selectedRequest.details?.country || "N/A"}</div>
                    </div>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 11, color: "var(--text-muted)" }}>Full Installation Address</label>
                    <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text)" }}>{selectedRequest.details?.address || "N/A"}</div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div>
                      <label style={{ fontSize: 11, color: "var(--text-muted)" }}>Industry Vertical</label>
                      <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text)" }}>{selectedRequest.details?.industry || "N/A"}</div>
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: "var(--text-muted)" }}>Intended Purpose</label>
                      <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text)" }}>{selectedRequest.details?.purpose || "N/A"}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Consultation specific details */}
              {selectedRequest.request_type === "consultation" && (
                <div>
                  <h4 style={{ fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", marginBottom: 12 }}>
                    Consultation Booking Details
                  </h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                    <div>
                      <label style={{ fontSize: 11, color: "var(--text-muted)" }}>Preferred Date</label>
                      <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text)" }}>{selectedRequest.details?.date || "N/A"}</div>
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: "var(--text-muted)" }}>Preferred Time</label>
                      <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text)" }}>{selectedRequest.details?.time || "N/A"}</div>
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: "var(--text-muted)" }}>Meeting Mode</label>
                      <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text)" }}>{selectedRequest.details?.meetingMode || "N/A"}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Requirements & Notes */}
              <div>
                <h4 style={{ fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", marginBottom: 8 }}>
                  Additional Requirements / Notes
                </h4>
                <div style={{
                  fontSize: 13, lineHeight: 1.6, padding: "12px 16px",
                  background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)",
                  borderRadius: 8, whiteSpace: "pre-wrap", color: "var(--text)"
                }}>
                  {selectedRequest.details?.requirements || "No additional notes provided."}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 12,
              padding: "16px 24px", borderTop: "1px solid var(--border)", background: "rgba(0,0,0,0.1)"
            }}>
              {role === "Admin" && selectedRequest.status === "pending" ? (
                <>
                  <button className="btn btn-success" onClick={() => review(selectedRequest.id, "approved")}>
                    <CheckCircle size={14} /> Approve Request
                  </button>
                  <button className="btn btn-danger" onClick={() => review(selectedRequest.id, "rejected")}>
                    <XCircle size={14} /> Reject Request
                  </button>
                </>
              ) : null}
              <button className="btn btn-ghost" onClick={() => setSelectedRequest(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

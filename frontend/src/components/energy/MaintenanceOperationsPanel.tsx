"use client";
import React, { useState, useEffect } from "react";
import {
  Wrench, Plus, CheckCircle2, Clock, AlertTriangle,
  RefreshCw, X, Calendar, User
} from "lucide-react";
import { api } from "@/lib/api";
import type { OperationalMaintenanceRecord, EnergySystem, UserRole } from "@/types";

interface MaintenanceOperationsPanelProps {
  role?: UserRole;
}

export function MaintenanceOperationsPanel({ role = "Operator" }: MaintenanceOperationsPanelProps) {
  const [records, setRecords] = useState<OperationalMaintenanceRecord[]>([]);
  const [systems, setSystems] = useState<EnergySystem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form state
  const [targetSystemId, setTargetSystemId] = useState<string>("");
  const [maintType, setMaintType] = useState<string>("PREVENTATIVE");
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [scheduledDate, setScheduledDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [technician, setTechnician] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const [recRes, sysRes] = await Promise.all([
        api.maintenance.list(statusFilter !== "ALL" ? { status: statusFilter } : undefined),
        api.energySystems.list()
      ]);

      if (recRes && recRes.data) setRecords(recRes.data);
      if (sysRes && sysRes.data) {
        setSystems(sysRes.data);
        if (!targetSystemId && sysRes.data.length > 0) {
          setTargetSystemId(sysRes.data[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load maintenance records:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleCreateWorkOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.maintenance.create({
        system_id: targetSystemId,
        maintenance_type: maintType,
        title,
        description,
        scheduled_date: scheduledDate,
        technician: technician || "Field Operations Engineer"
      });
      setShowCreateModal(false);
      setTitle("");
      setDescription("");
      loadData();
    } catch (err) {
      console.error("Failed to create work order:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await api.maintenance.update(id, {
        status: newStatus,
        completed_date: newStatus === "COMPLETED" ? new Date().toISOString().split("T")[0] : undefined
      });
      loadData();
    } catch (err) {
      console.error("Failed to update maintenance record:", err);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Top Bar with Filter & Create Button */}
      <div className="source-card" style={{ padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", gap: 6 }}>
            {(["ALL", "SCHEDULED", "IN PROGRESS", "COMPLETED", "OVERDUE"] as const).map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                style={{
                  padding: "6px 12px",
                  fontSize: 11,
                  fontWeight: 700,
                  borderRadius: 4,
                  border: "1px solid var(--border)",
                  background: statusFilter === st ? "var(--accent, #007bff)" : "transparent",
                  color: statusFilter === st ? "#fff" : "var(--text-muted)",
                  cursor: "pointer"
                }}
              >
                {st}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
            style={{ fontSize: 11, padding: "8px 16px", display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <Plus size={14} /> Schedule Work Order
          </button>
        </div>
      </div>

      {/* Maintenance Records Table */}
      <div className="source-card" style={{ padding: 22 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 16px" }}>
          Operational Work Orders & Maintenance History
        </h3>

        <div style={{ overflowX: "auto" }}>
          <table className="source-table" style={{ width: "100%", fontSize: 12 }}>
            <thead>
              <tr>
                <th>Work Order ID</th>
                <th>System</th>
                <th>Maintenance Type</th>
                <th>Work Order Title</th>
                <th>Scheduled Date</th>
                <th>Assigned Technician</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {records.map(r => (
                <tr key={r.id}>
                  <td style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--accent, #007bff)" }}>
                    {r.id}
                  </td>
                  <td style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{r.system_id}</td>
                  <td>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)" }}>
                      {r.maintenance_type}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{r.title}</div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>{r.description}</div>
                  </td>
                  <td style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>{r.scheduled_date}</td>
                  <td style={{ fontSize: 11 }}>{r.technician}</td>
                  <td>
                    <span style={{
                      padding: "2px 6px",
                      borderRadius: 4,
                      fontSize: 10,
                      fontWeight: 700,
                      background: r.status === "COMPLETED" ? "rgba(34,197,94,0.15)" : (r.status === "IN PROGRESS" ? "rgba(59,130,246,0.15)" : "rgba(245,158,11,0.15)"),
                      color: r.status === "COMPLETED" ? "#22c55e" : (r.status === "IN PROGRESS" ? "#3b82f6" : "#f59e0b")
                    }}>
                      {r.status}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {r.status === "SCHEDULED" && (
                      <button
                        onClick={() => handleUpdateStatus(r.id, "IN PROGRESS")}
                        className="btn btn-ghost"
                        style={{ fontSize: 11, padding: "3px 8px" }}
                      >
                        Start Work
                      </button>
                    )}
                    {r.status === "IN PROGRESS" && (
                      <button
                        onClick={() => handleUpdateStatus(r.id, "COMPLETED")}
                        className="btn btn-primary"
                        style={{ fontSize: 11, padding: "3px 8px" }}
                      >
                        Mark Complete
                      </button>
                    )}
                    {r.status === "COMPLETED" && (
                      <span style={{ fontSize: 11, color: "var(--green, #22c55e)", fontWeight: 600 }}>Closed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Work Order Modal */}
      {showCreateModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.7)", zIndex: 1200, display: "flex",
          alignItems: "center", justifyContent: "center", padding: 20
        }}>
          <div className="source-card animate-slide-up" style={{ width: "100%", maxWidth: 520, padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Create Maintenance Work Order</h3>
              <button onClick={() => setShowCreateModal(false)} className="btn btn-ghost" style={{ padding: 4 }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateWorkOrder} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Target Energy System *</label>
                <select className="source-input" value={targetSystemId} onChange={e => setTargetSystemId(e.target.value)}>
                  {systems.map(s => (
                    <option key={s.id} value={s.id}>{s.id} — {s.system_name} ({s.model})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Maintenance Category *</label>
                <select className="source-input" value={maintType} onChange={e => setMaintType(e.target.value)}>
                  <option value="PREVENTATIVE">PREVENTATIVE</option>
                  <option value="CORRECTIVE">CORRECTIVE</option>
                  <option value="INSPECTION">INSPECTION</option>
                  <option value="EMERGENCY">EMERGENCY</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Work Order Title *</label>
                <input
                  className="source-input"
                  type="text"
                  placeholder="e.g. Dyneema tether line ultrasonic inspection"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Scope of Work & Protocol *</label>
                <textarea
                  className="source-input"
                  rows={3}
                  placeholder="Describe maintenance instructions, safety lockouts, and target metrics..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  required
                  style={{ resize: "none" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Scheduled Date *</label>
                  <input
                    className="source-input"
                    type="date"
                    value={scheduledDate}
                    onChange={e => setScheduledDate(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Lead Technician *</label>
                  <input
                    className="source-input"
                    type="text"
                    placeholder="e.g. Vikram Singh (Tech)"
                    value={technician}
                    onChange={e => setTechnician(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-ghost" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={submitting}>
                  {submitting ? "Creating..." : "Save Work Order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

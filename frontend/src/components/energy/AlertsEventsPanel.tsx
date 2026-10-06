"use client";
import React, { useState, useEffect } from "react";
import {
  AlertTriangle, AlertOctagon, CheckCircle2, ShieldAlert,
  Search, Filter, Check, Clock, RefreshCw, X
} from "lucide-react";
import { api } from "@/lib/api";
import type { PlatformAlert, UserRole } from "@/types";

interface AlertsEventsPanelProps {
  role?: UserRole;
}

export function AlertsEventsPanel({ role = "Operator" }: AlertsEventsPanelProps) {
  const [alerts, setAlerts] = useState<PlatformAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ACTIVE");
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");
  const [search, setSearch] = useState<string>("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [resolveModalAlert, setResolveModalAlert] = useState<PlatformAlert | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState<string>("");

  const loadAlerts = async () => {
    try {
      const params: Record<string, string> = {};
      if (statusFilter !== "ALL") params.status = statusFilter;
      if (severityFilter !== "ALL") params.severity = severityFilter;
      if (search.trim()) params.search = search.trim();

      const res = await api.alerts.list(params);
      if (res && res.data) {
        setAlerts(res.data);
      }
    } catch (err) {
      console.error("Failed to load alerts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, [statusFilter, severityFilter, search]);

  const handleAcknowledge = async (id: string) => {
    setActionLoading(id);
    try {
      await api.alerts.acknowledge(id);
      loadAlerts();
    } catch (err) {
      console.error("Failed to acknowledge alert:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolveModalAlert) return;
    setActionLoading(resolveModalAlert.id);
    try {
      await api.alerts.resolve(resolveModalAlert.id, resolutionNotes);
      setResolveModalAlert(null);
      setResolutionNotes("");
      loadAlerts();
    } catch (err) {
      console.error("Failed to resolve alert:", err);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Filter and Search Bar */}
      <div className="source-card" style={{ padding: 16 }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 260 }}>
            <div style={{ position: "relative", width: "100%" }}>
              <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input
                className="source-input"
                type="text"
                placeholder="Search alerts by System, Title, Type, or Description..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ paddingLeft: 34 }}
              />
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ display: "flex", gap: 6 }}>
              {(["ACTIVE", "ACKNOWLEDGED", "RESOLVED", "ALL"] as const).map(st => (
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

            <select
              className="source-input"
              value={severityFilter}
              onChange={e => setSeverityFilter(e.target.value)}
              style={{ padding: "6px 10px", fontSize: 12, width: 140 }}
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">CRITICAL</option>
              <option value="WARNING">WARNING</option>
              <option value="INFO">INFO</option>
            </select>
          </div>
        </div>
      </div>

      {/* Alerts List */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>
          <RefreshCw className="animate-spin" size={24} style={{ margin: "0 auto 10px" }} />
          <p style={{ fontSize: 12 }}>Loading platform threshold alerts...</p>
        </div>
      ) : alerts.length === 0 ? (
        <div className="source-card" style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>
          <CheckCircle2 size={36} color="#22c55e" style={{ margin: "0 auto 12px" }} />
          <h4 style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", margin: 0 }}>No Alerts Found</h4>
          <p style={{ fontSize: 12, margin: "6px 0 0" }}>All systems operating within acceptable safety boundaries.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {alerts.map(alt => (
            <div
              key={alt.id}
              className="source-card"
              style={{
                padding: 18,
                borderLeft: `4px solid ${
                  alt.severity === "CRITICAL" ? "#ef4444" : (alt.severity === "WARNING" ? "#f59e0b" : "#3b82f6")
                }`,
                display: "flex",
                flexDirection: "column",
                gap: 12
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{
                      fontSize: 10,
                      fontWeight: 800,
                      padding: "2px 6px",
                      borderRadius: 4,
                      background: alt.severity === "CRITICAL" ? "rgba(239,68,68,0.2)" : (alt.severity === "WARNING" ? "rgba(245,158,11,0.2)" : "rgba(59,130,246,0.2)"),
                      color: alt.severity === "CRITICAL" ? "#ef4444" : (alt.severity === "WARNING" ? "#f59e0b" : "#3b82f6")
                    }}>
                      {alt.severity}
                    </span>

                    <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 12, color: "var(--accent, #007bff)" }}>
                      {alt.id}
                    </span>

                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4,
                      background: alt.status === "ACTIVE" ? "rgba(239,68,68,0.15)" : (alt.status === "ACKNOWLEDGED" ? "rgba(245,158,11,0.15)" : "rgba(34,197,94,0.15)"),
                      color: alt.status === "ACTIVE" ? "#ef4444" : (alt.status === "ACKNOWLEDGED" ? "#f59e0b" : "#22c55e")
                    }}>
                      STATUS: {alt.status}
                    </span>

                    <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                      System: <strong>{alt.system_id}</strong> ({alt.system_name || alt.model || "Airborne Unit"})
                    </span>
                  </div>

                  <h4 style={{ fontSize: 15, fontWeight: 700, margin: "8px 0 4px" }}>
                    {alt.title}
                  </h4>

                  <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>
                    {alt.description}
                  </p>

                  {alt.threshold_breached && (
                    <div style={{ fontSize: 11, color: "var(--error, #ef4444)", fontFamily: "var(--font-mono)", marginTop: 6 }}>
                      ⚠️ Breach Metric: {alt.threshold_breached}
                    </div>
                  )}
                </div>

                {/* Operator Actions */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {alt.status === "ACTIVE" && (
                    <button
                      onClick={() => handleAcknowledge(alt.id)}
                      disabled={actionLoading === alt.id}
                      className="btn btn-ghost"
                      style={{ fontSize: 11, padding: "6px 12px", border: "1px solid var(--border)" }}
                    >
                      {actionLoading === alt.id ? "Acknowledging..." : "Acknowledge"}
                    </button>
                  )}

                  {alt.status !== "RESOLVED" && (
                    <button
                      onClick={() => setResolveModalAlert(alt)}
                      className="btn btn-primary"
                      style={{ fontSize: 11, padding: "6px 12px" }}
                    >
                      Resolve Alert
                    </button>
                  )}
                </div>
              </div>

              {/* Timestamp & Operator Audit History */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 16, borderTop: "1px solid var(--border)", paddingTop: 10, fontSize: 11, color: "var(--text-muted)" }}>
                <span>Triggered: {new Date(alt.triggered_at).toLocaleString("en-IN")}</span>
                {alt.acknowledged_at && (
                  <span>
                    ✓ Acknowledged: {new Date(alt.acknowledged_at).toLocaleTimeString("en-IN")} by {alt.acknowledged_by || "Operator"}
                  </span>
                )}
                {alt.resolved_at && (
                  <span>
                    ✓ Resolved: {new Date(alt.resolved_at).toLocaleTimeString("en-IN")} by {alt.resolved_by || "Engineer"}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Resolve Alert Modal */}
      {resolveModalAlert && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.7)", zIndex: 1200, display: "flex",
          alignItems: "center", justifyContent: "center", padding: 20
        }}>
          <div className="source-card animate-slide-up" style={{ width: "100%", maxWidth: 480, padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Resolve Alert: {resolveModalAlert.id}</h3>
              <button onClick={() => setResolveModalAlert(null)} className="btn btn-ghost" style={{ padding: 4 }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleResolve} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                  Resolution Notes & Actions Taken *
                </label>
                <textarea
                  className="source-input"
                  rows={4}
                  placeholder="e.g. Inspect load cell bridle; recalibrated tension sensor; nominal operation restored."
                  value={resolutionNotes}
                  onChange={e => setResolutionNotes(e.target.value)}
                  required
                  style={{ resize: "none" }}
                />
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button type="button" onClick={() => setResolveModalAlert(null)} className="btn btn-ghost" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={actionLoading === resolveModalAlert.id}>
                  {actionLoading === resolveModalAlert.id ? "Saving..." : "Confirm Resolution"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

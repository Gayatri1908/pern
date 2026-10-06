"use client";
// ============================================================
// AlertsPanel — alert management with severity filters
// ============================================================
import React, { useEffect, useState, useCallback } from "react";
import { AlertTriangle, CheckCircle, RefreshCw, Filter } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DataTable } from "@/components/ui/DataTable";
import { api } from "@/lib/api";
import type { Alert, AlertSeverity, AlertStatus, UserRole } from "@/types";

interface Props { role: UserRole; }

const SEVERITIES: AlertSeverity[] = ["critical", "warning", "info"];
const STATUSES: AlertStatus[] = ["open", "acknowledged", "resolved"];

export function AlertsPanel({ role }: Props) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState<AlertSeverity | "all">("all");
  const [filterStatus, setFilterStatus] = useState<AlertStatus | "all">("open");
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filterSeverity !== "all") params.severity = filterSeverity;
      const res = await api.alerts.list(params) as any;
      const list = res?.data ?? res ?? [];
      setAlerts(Array.isArray(list) ? list : []);
    } catch (e) { setError(String(e)); }
    finally { setLoading(false); }
  }, [filterSeverity, filterStatus]);

  useEffect(() => { load(); }, [load]);

  async function updateStatus(alert: Alert, newStatus: AlertStatus) {
    setUpdating(alert.id);
    try {
      await api.alerts.update(alert.id, { status: newStatus });
      setAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, status: newStatus } : a));
    } catch (e) { setError(String(e)); }
    finally { setUpdating(null); }
  }

  const columns = [
    {
      key: "severity", label: "Severity", sortable: true,
      render: (a: Alert) => <StatusBadge status={a.severity} />,
    },
    { key: "metric", label: "Metric", sortable: true },
    {
      key: "value", label: "Value",
      render: (a: Alert) => (
        <span style={{ fontFamily: "var(--font-mono)", color: "var(--text)" }}>{a.value.toFixed(2)}</span>
      ),
    },
    {
      key: "status", label: "Status", sortable: true,
      render: (a: Alert) => <StatusBadge status={a.status} />,
    },
    {
      key: "created_at", label: "Time", sortable: true,
      render: (a: Alert) => (
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>
          {new Date(a.created_at).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
        </span>
      ),
    },
    {
      key: "suggested_solution", label: "Suggested Action",
      render: (a: Alert) => (
        <span style={{ color: "var(--text-secondary)", maxWidth: 200, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {a.suggested_solution ?? "—"}
        </span>
      ),
    },
    ...(role === "Admin" ? [{
      key: "actions", label: "Actions",
      render: (a: Alert) => (
        <div style={{ display: "flex", gap: 6 }}>
          {a.status === "open" && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={(e) => { e.stopPropagation(); updateStatus(a, "acknowledged"); }}
              disabled={updating === a.id}
            >
              {updating === a.id ? <RefreshCw size={11} className="animate-spin" /> : "Acknowledge"}
            </button>
          )}
          {a.status !== "resolved" && (
            <button
              className="btn btn-success btn-sm"
              onClick={(e) => { e.stopPropagation(); updateStatus(a, "resolved"); }}
              disabled={updating === a.id}
            >
              <CheckCircle size={11} /> Resolve
            </button>
          )}
        </div>
      ),
    }] : []),
  ];

  const critCount = alerts.filter(a => a.severity === "critical" && a.status === "open").length;

  return (
    <div className="animate-slide-up" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, letterSpacing: "0.04em", textTransform: "uppercase" }}>
            Alert Center
          </h2>
          {critCount > 0 && (
            <span style={{
              background: "rgba(229,72,77,0.12)", color: "var(--error)",
              border: "1px solid rgba(229,72,77,0.2)",
              borderRadius: 9999, padding: "2px 8px",
              fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700,
              display: "flex", alignItems: "center", gap: 4
            }}>
              <AlertTriangle size={10} />{critCount} Critical
            </span>
          )}
        </div>
        <button className="btn btn-ghost btn-sm" onClick={load}>
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {error && (
        <div style={{ background: "rgba(229,72,77,0.1)", border: "1px solid rgba(229,72,77,0.2)", borderRadius: 10, padding: "10px 14px", color: "var(--error)", fontSize: 12 }}>
          {error}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <Filter size={13} color="var(--text-muted)" />
        <span style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>SEVERITY:</span>
        {(["all", ...SEVERITIES] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilterSeverity(s as AlertSeverity | "all")}
            className={`btn btn-sm ${filterSeverity === s ? "btn-primary" : "btn-ghost"}`}
          >
            {s}
          </button>
        ))}
        <span style={{ width: 1, height: 20, background: "var(--border)", margin: "0 4px" }} />
        <span style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>STATUS:</span>
        {(["all", ...STATUSES] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s as AlertStatus | "all")}
            className={`btn btn-sm ${filterStatus === s ? "btn-primary" : "btn-ghost"}`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="source-card" style={{ overflow: "hidden" }}>
        <DataTable<Alert>
          columns={columns}
          data={alerts}
          keyFn={a => a.id}
          loading={loading}
          emptyMessage="No alerts match the current filters."
        />
      </div>
    </div>
  );
}

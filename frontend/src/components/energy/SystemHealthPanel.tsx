"use client";
import React, { useState, useEffect } from "react";
import {
  Activity, ShieldCheck, AlertTriangle, AlertOctagon,
  RefreshCw, CheckCircle2, ChevronRight, Cpu
} from "lucide-react";
import { api } from "@/lib/api";

export function SystemHealthPanel() {
  const [fleetHealth, setFleetHealth] = useState<any[]>([]);
  const [selectedSystemId, setSelectedSystemId] = useState<string>("SYS-X1-001");
  const [systemHealthDetail, setSystemHealthDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const fleetRes = await api.health.fleet();
      if (fleetRes && fleetRes.data) {
        setFleetHealth(fleetRes.data);
        if (!selectedSystemId && fleetRes.data.length > 0) {
          setSelectedSystemId(fleetRes.data[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load fleet health:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadDetail = async (id: string) => {
    try {
      const res = await api.energySystems.health(id);
      if (res) {
        setSystemHealthDetail(res);
      }
    } catch (err) {
      console.error(`Failed to load health for system ${id}:`, err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedSystemId) {
      loadDetail(selectedSystemId);
    }
  }, [selectedSystemId]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Overview Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
        <div className="source-card" style={{ padding: 18, borderLeft: "4px solid #10b981" }}>
          <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase" }}>NORMAL SYSTEMS</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#10b981", marginTop: 4 }}>
            {fleetHealth.filter(s => (s.overall_health_score || 90) >= 80).length}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 4 }}>Health Score &gt; 80%</div>
        </div>

        <div className="source-card" style={{ padding: 18, borderLeft: "4px solid #f59e0b" }}>
          <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase" }}>WARNING DEGRADATIONS</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#f59e0b", marginTop: 4 }}>
            {fleetHealth.filter(s => (s.overall_health_score || 90) < 80 && (s.overall_health_score || 90) >= 50).length}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 4 }}>Component Wear Detected</div>
        </div>

        <div className="source-card" style={{ padding: 18, borderLeft: "4px solid #ef4444" }}>
          <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase" }}>CRITICAL FAULTS</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#ef4444", marginTop: 4 }}>
            {fleetHealth.filter(s => (s.overall_health_score || 90) < 50 || s.status === "FAULT").length}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 4 }}>Immediate Servicing Needed</div>
        </div>
      </div>

      {/* Main Two-Column View: Fleet Health Matrix & Subsystem Diagnostic Tree */}
      <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 16 }}>
        {/* Left Column: Systems List */}
        <div className="source-card" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 10 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" }}>
            Fleet Energy Systems Matrix
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: "70vh", overflowY: "auto" }}>
            {fleetHealth.map(s => {
              const isSelected = s.id === selectedSystemId;
              const score = s.overall_health_score || 92;
              return (
                <div
                  key={s.id}
                  onClick={() => setSelectedSystemId(s.id)}
                  style={{
                    padding: 12,
                    borderRadius: 8,
                    border: isSelected ? "1px solid var(--accent, #007bff)" : "1px solid var(--border)",
                    background: isSelected ? "rgba(0, 123, 255, 0.08)" : "rgba(255, 255, 255, 0.02)",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 13, color: "var(--text)" }}>
                        {s.id}
                      </span>
                      <span style={{
                        fontSize: 9, fontWeight: 700, padding: "2px 5px", borderRadius: 4,
                        background: s.status === "ONLINE" ? "rgba(34,197,94,0.15)" : (s.status === "FAULT" ? "rgba(239,68,68,0.15)" : "rgba(245,158,11,0.15)"),
                        color: s.status === "ONLINE" ? "#22c55e" : (s.status === "FAULT" ? "#ef4444" : "#f59e0b")
                      }}>
                        {s.status}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{s.model}</div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{
                      fontSize: 16, fontWeight: 800, fontFamily: "var(--font-mono)",
                      color: score >= 80 ? "#22c55e" : (score >= 50 ? "#f59e0b" : "#ef4444")
                    }}>
                      {score}%
                    </div>
                    <div style={{ fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase" }}>Health</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Hierarchical Subsystems & Components Diagnostic */}
        <div className="source-card" style={{ padding: 22 }}>
          {systemHealthDetail ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid var(--border)", paddingBottom: 14 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 18, fontWeight: 800, fontFamily: "var(--font-mono)", color: "var(--accent, #007bff)" }}>
                      {systemHealthDetail.system_id}
                    </span>
                    <span style={{ fontSize: 16, fontWeight: 700 }}>{systemHealthDetail.system_name}</span>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 4,
                      background: systemHealthDetail.severity_level === "NORMAL" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                      color: systemHealthDetail.severity_level === "NORMAL" ? "#22c55e" : "#ef4444"
                    }}>
                      SEVERITY: {systemHealthDetail.severity_level}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                    Automated Fault Diagnostics • Last Sensor Scan: {new Date(systemHealthDetail.diagnostic_timestamp).toLocaleTimeString("en-IN")}
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 28, fontWeight: 900, fontFamily: "var(--font-mono)", color: systemHealthDetail.overall_health_score >= 80 ? "#22c55e" : "#ef4444" }}>
                    {systemHealthDetail.overall_health_score}%
                  </div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase" }}>Composite Health Index</div>
                </div>
              </div>

              {/* Subsystems Breakdown */}
              <div>
                <h4 style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
                  Subsystem Breakdown (System → Subsystems → Components)
                </h4>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
                  {(systemHealthDetail.subsystems || []).map((sub: any) => (
                    <div key={sub.subsystem_name} style={{
                      padding: 14,
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid var(--border)",
                      borderLeft: `3px solid ${sub.status === "NORMAL" ? "#22c55e" : (sub.status === "CRITICAL" ? "#ef4444" : "#f59e0b")}`,
                      borderRadius: 8
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 700 }}>{sub.subsystem_name}</span>
                        <span style={{
                          fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4,
                          background: sub.status === "NORMAL" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                          color: sub.status === "NORMAL" ? "#22c55e" : "#ef4444"
                        }}>
                          {sub.status}
                        </span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <div style={{ flex: 1, height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
                          <div style={{
                            width: `${sub.score}%`,
                            height: "100%",
                            background: sub.score > 80 ? "#22c55e" : (sub.score > 50 ? "#f59e0b" : "#ef4444")
                          }} />
                        </div>
                        <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", fontWeight: 700 }}>{sub.score}%</span>
                      </div>

                      <div style={{ fontSize: 10, color: "var(--text-muted)" }}>
                        Hardware Components: {sub.components?.length || 0} monitored
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hardware Components Table */}
              <div>
                <h4 style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
                  Associated Component Health Log
                </h4>
                <div style={{ overflowX: "auto" }}>
                  <table className="source-table" style={{ width: "100%", fontSize: 11 }}>
                    <thead>
                      <tr>
                        <th>Component</th>
                        <th>Type</th>
                        <th>Serial Number</th>
                        <th>Health Score</th>
                        <th>Status</th>
                        <th>Operating Hours</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(systemHealthDetail.components || []).map((c: any) => (
                        <tr key={c.id}>
                          <td style={{ fontWeight: 600 }}>{c.component_name}</td>
                          <td style={{ color: "var(--text-secondary)" }}>{c.component_type}</td>
                          <td style={{ fontFamily: "var(--font-mono)" }}>{c.serial_number}</td>
                          <td>
                            <span style={{
                              fontWeight: 700,
                              color: c.health_score > 80 ? "#22c55e" : (c.health_score > 50 ? "#f59e0b" : "#ef4444")
                            }}>
                              {c.health_score}%
                            </span>
                          </td>
                          <td>
                            <span style={{
                              fontSize: 9, padding: "2px 5px", borderRadius: 4,
                              background: c.status === "ONLINE" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                              color: c.status === "ONLINE" ? "#22c55e" : "#ef4444"
                            }}>
                              {c.status}
                            </span>
                          </td>
                          <td style={{ fontFamily: "var(--font-mono)" }}>{c.operating_hours.toFixed(1)} hrs</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "100px 0", color: "var(--text-muted)" }}>
              Select a system from the left matrix to inspect its subsystem diagnostic hierarchy.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

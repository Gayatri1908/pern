"use client";
import React, { useState, useEffect } from "react";
import {
  X, Zap, Wind, Activity, AlertTriangle, ShieldCheck,
  Wrench, Gauge, Clock, Calendar, CheckCircle2, AlertOctagon, TrendingUp, RefreshCw
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from "recharts";
import { api } from "@/lib/api";
import type { EnergySystem, TelemetryRecord } from "@/types";

interface EnergySystemDetailModalProps {
  system: EnergySystem;
  onClose: () => void;
  onRefreshParent?: () => void;
}

export function EnergySystemDetailModal({ system, onClose, onRefreshParent }: EnergySystemDetailModalProps) {
  const [detail, setDetail] = useState<EnergySystem | null>(null);
  const [telemetry, setTelemetry] = useState<TelemetryRecord[]>([]);
  const [telemetryRange, setTelemetryRange] = useState<"1h" | "24h" | "7d" | "30d">("24h");
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<"telemetry" | "health" | "components" | "alerts">("telemetry");

  const loadFullDetails = async () => {
    try {
      const [sysRes, telRes] = await Promise.all([
        api.energySystems.get(system.id),
        api.energySystems.telemetry(system.id, telemetryRange)
      ]);

      if (sysRes && sysRes.data) {
        setDetail(sysRes.data);
      }
      if (telRes && telRes.data) {
        setTelemetry(telRes.data);
      }
    } catch (err) {
      console.error("Failed to load full system details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFullDetails();
  }, [system.id, telemetryRange]);

  const currentSys = detail || system;
  const latestTel = currentSys.latest_telemetry || (telemetry.length > 0 ? telemetry[telemetry.length - 1] : null);

  const chartData = telemetry.map(t => ({
    time: new Date(t.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    power: t.power_output_kw,
    wind: t.wind_speed_ms,
    tension: t.tether_tension_kn,
    voltage: t.voltage_v,
    rpm: t.rotor_rpm,
    altitude: t.flight_altitude_m
  }));

  return (
    <div style={{
      position: "fixed",
      top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0, 0, 0, 0.75)",
      backdropFilter: "blur(6px)",
      zIndex: 1200,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 24
    }}>
      <div className="source-card animate-slide-up" style={{
        width: "100%",
        maxWidth: 1040,
        maxHeight: "92vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        boxShadow: "0 24px 60px rgba(0,0,0,0.5)"
      }}>
        {/* Header */}
        <div style={{
          padding: "20px 24px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "rgba(255, 255, 255, 0.02)"
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 18, color: "var(--accent, #007bff)" }}>
                {currentSys.id}
              </span>
              <span style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>
                {currentSys.system_name} ({currentSys.model})
              </span>
              <span style={{
                padding: "2px 8px",
                borderRadius: 4,
                fontSize: 10,
                fontWeight: 700,
                fontFamily: "var(--font-mono)",
                background: currentSys.status === "ONLINE" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                color: currentSys.status === "ONLINE" ? "#22c55e" : "#ef4444"
              }}>
                {currentSys.status}
              </span>
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
              Location: {currentSys.location} • Serial: {currentSys.serial_number} • Commissioned: {currentSys.commission_date}
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn btn-ghost"
            style={{ padding: 6, color: "var(--text-muted)" }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Operational KPI Strip */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
          gap: 12,
          padding: "16px 24px",
          background: "rgba(0, 123, 255, 0.03)",
          borderBottom: "1px solid var(--border)"
        }}>
          <div>
            <span style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase" }}>Rated Power</span>
            <div style={{ fontSize: 18, fontWeight: 800, fontFamily: "var(--font-mono)", color: "var(--text)" }}>
              {currentSys.rated_power_kw} <span style={{ fontSize: 11, color: "var(--text-muted)" }}>kW</span>
            </div>
          </div>

          <div>
            <span style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase" }}>Current Output</span>
            <div style={{ fontSize: 18, fontWeight: 800, fontFamily: "var(--font-mono)", color: currentSys.current_power_kw > 0 ? "#22c55e" : "var(--text-muted)" }}>
              {currentSys.current_power_kw.toFixed(1)} <span style={{ fontSize: 11, color: "var(--text-muted)" }}>kW</span>
            </div>
          </div>

          <div>
            <span style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase" }}>Today Energy</span>
            <div style={{ fontSize: 18, fontWeight: 800, fontFamily: "var(--font-mono)", color: "var(--text)" }}>
              {currentSys.energy_today_kwh.toFixed(1)} <span style={{ fontSize: 11, color: "var(--text-muted)" }}>kWh</span>
            </div>
          </div>

          <div>
            <span style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase" }}>Availability</span>
            <div style={{ fontSize: 18, fontWeight: 800, fontFamily: "var(--font-mono)", color: "#06b6d4" }}>
              {currentSys.availability_pct.toFixed(1)}%
            </div>
          </div>

          <div>
            <span style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase" }}>Health Status</span>
            <div style={{ fontSize: 18, fontWeight: 800, color: currentSys.health_status === "GOOD" ? "#22c55e" : "#ef4444" }}>
              {currentSys.health_status}
            </div>
          </div>

          <div>
            <span style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase" }}>Active Alerts</span>
            <div style={{ fontSize: 18, fontWeight: 800, color: currentSys.active_alerts_count > 0 ? "#ef4444" : "var(--text-muted)" }}>
              {currentSys.active_alerts_count}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: "flex", gap: 16, padding: "0 24px", borderBottom: "1px solid var(--border)" }}>
          {[
            { id: "telemetry", label: "Live Telemetry & Charts" },
            { id: "health", label: "Subsystem Health Diagnostics" },
            { id: "components", label: `Hardware Components (${currentSys.components?.length || 0})` },
            { id: "alerts", label: `Active Alerts (${currentSys.active_alerts?.length || 0})` }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveSubTab(t.id as any)}
              style={{
                background: "none",
                border: "none",
                padding: "12px 4px",
                fontSize: 12,
                fontWeight: 600,
                color: activeSubTab === t.id ? "var(--accent, #007bff)" : "var(--text-muted)",
                borderBottom: activeSubTab === t.id ? "2px solid var(--accent, #007bff)" : "2px solid transparent",
                cursor: "pointer"
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Scrollable Modal Content */}
        <div style={{ padding: 24, overflowY: "auto", flex: 1 }}>
          {activeSubTab === "telemetry" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Telemetry Sensor Live Badges */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
                gap: 10,
                padding: 14,
                background: "rgba(255,255,255,0.02)",
                borderRadius: 8,
                border: "1px solid var(--border)"
              }}>
                <div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Wind Speed</div>
                  <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                    {latestTel?.wind_speed_ms?.toFixed(1) || "0.0"} m/s
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Tether Tension</div>
                  <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                    {latestTel?.tether_tension_kn?.toFixed(1) || "0.0"} kN
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Rotor Speed</div>
                  <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                    {latestTel?.rotor_rpm || "0"} RPM
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Flight Altitude</div>
                  <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                    {latestTel?.flight_altitude_m || "0"} m
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Bus Voltage</div>
                  <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                    {latestTel?.voltage_v?.toFixed(1) || "0.0"} V
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Generator Temp</div>
                  <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                    {latestTel?.temperature_c?.toFixed(1) || "0.0"} °C
                  </div>
                </div>
              </div>

              {/* Time Range Selector */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Power Output & Wind Speed Historical Trajectory
                </span>
                <div style={{ display: "flex", gap: 6 }}>
                  {(["1h", "24h", "7d", "30d"] as const).map(r => (
                    <button
                      key={r}
                      onClick={() => setTelemetryRange(r)}
                      style={{
                        padding: "4px 10px",
                        fontSize: 10,
                        fontWeight: 700,
                        borderRadius: 4,
                        border: "1px solid var(--border)",
                        background: telemetryRange === r ? "var(--accent, #007bff)" : "transparent",
                        color: telemetryRange === r ? "#fff" : "var(--text-muted)",
                        cursor: "pointer"
                      }}
                    >
                      {r.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chart */}
              <div style={{ height: 260, width: "100%" }}>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="powerGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#007bff" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#007bff" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="time" stroke="var(--text-muted)" fontSize={10} />
                      <YAxis stroke="var(--text-muted)" fontSize={10} unit=" kW" />
                      <Tooltip
                        contentStyle={{ background: "var(--bg-card, #121824)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 11 }}
                      />
                      <Area type="monotone" dataKey="power" name="Power Output (kW)" stroke="#007bff" strokeWidth={2} fill="url(#powerGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ textAlign: "center", padding: "80px 0", color: "var(--text-muted)", fontSize: 12 }}>
                    No telemetry records found for selected window.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeSubTab === "health" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
                {[
                  { name: "Aerodynamics & Wing Structure", score: 96, status: "NORMAL" },
                  { name: "Ground Tether & High-Torque Winch", score: currentSys.status === "FAULT" ? 44 : 92, status: currentSys.status === "FAULT" ? "CRITICAL" : "NORMAL" },
                  { name: "Permanent Magnet Generator (PMSG)", score: 98, status: "NORMAL" },
                  { name: "Bidirectional Power Inverter", score: 95, status: "NORMAL" },
                  { name: "Ground Storage Buffer Rack", score: 97, status: "NORMAL" },
                  { name: "Autopilot Avionics & Telemetry Link", score: 99, status: "NORMAL" }
                ].map(sub => (
                  <div key={sub.name} className="source-card" style={{ padding: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{sub.name}</span>
                      <span style={{
                        fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4,
                        background: sub.status === "NORMAL" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                        color: sub.status === "NORMAL" ? "#22c55e" : "#ef4444"
                      }}>
                        {sub.status}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ flex: 1, height: 6, background: "rgba(255,255,255,0.08)", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{
                          width: `${sub.score}%`,
                          height: "100%",
                          background: sub.score > 80 ? "#22c55e" : (sub.score > 60 ? "#f59e0b" : "#ef4444")
                        }} />
                      </div>
                      <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                        {sub.score}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSubTab === "components" && (
            <div>
              <table className="source-table" style={{ width: "100%", fontSize: 12 }}>
                <thead>
                  <tr>
                    <th>Component Name</th>
                    <th>Type</th>
                    <th>Serial Number</th>
                    <th>Health</th>
                    <th>Status</th>
                    <th>Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {(currentSys.components || []).map(c => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 600 }}>{c.component_name}</td>
                      <td style={{ color: "var(--text-secondary)" }}>{c.component_type}</td>
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>{c.serial_number}</td>
                      <td>
                        <span style={{
                          fontWeight: 700,
                          color: c.health_score > 80 ? "#22c55e" : (c.health_score > 60 ? "#f59e0b" : "#ef4444")
                        }}>
                          {c.health_score}%
                        </span>
                      </td>
                      <td>
                        <span style={{
                          fontSize: 10,
                          padding: "2px 6px",
                          borderRadius: 4,
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
          )}

          {activeSubTab === "alerts" && (
            <div>
              {(currentSys.active_alerts || []).length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)", fontSize: 12 }}>
                  <CheckCircle2 size={32} color="#22c55e" style={{ margin: "0 auto 8px" }} />
                  No active alerts or threshold breaches for this system.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {(currentSys.active_alerts || []).map(alt => (
                    <div key={alt.id} style={{
                      padding: 14,
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid var(--border)",
                      borderLeft: `3px solid ${alt.severity === "CRITICAL" ? "#ef4444" : "#f59e0b"}`,
                      borderRadius: 8
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{
                              fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4,
                              background: alt.severity === "CRITICAL" ? "rgba(239,68,68,0.2)" : "rgba(245,158,11,0.2)",
                              color: alt.severity === "CRITICAL" ? "#ef4444" : "#f59e0b"
                            }}>
                              {alt.severity}
                            </span>
                            <span style={{ fontSize: 13, fontWeight: 700 }}>{alt.title}</span>
                          </div>
                          <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "6px 0 0" }}>
                            {alt.description}
                          </p>
                          {alt.threshold_breached && (
                            <p style={{ fontSize: 11, color: "var(--error, #ef4444)", fontFamily: "var(--font-mono)", margin: "4px 0 0" }}>
                              Threshold: {alt.threshold_breached}
                            </p>
                          )}
                        </div>
                        <span style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                          {new Date(alt.triggered_at).toLocaleTimeString("en-IN")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

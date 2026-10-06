"use client";
import React, { useState, useEffect } from "react";
import {
  Zap, Wind, Activity, AlertTriangle, ShieldCheck, Cpu,
  TrendingUp, Clock, RefreshCw, CheckCircle2, AlertOctagon, Wrench, ShieldAlert, ArrowUpRight
} from "lucide-react";
import { api } from "@/lib/api";
import type { EnergySystem, MissionControlData } from "@/types";

interface MissionControlPanelProps {
  onSelectSystem: (system: EnergySystem) => void;
  onNavigateTab: (tab: string) => void;
}

export function MissionControlPanel({ onSelectSystem, onNavigateTab }: MissionControlPanelProps) {
  const [data, setData] = useState<{
    overview: MissionControlData | null;
    systems: EnergySystem[];
    recent_events: any[];
  }>({
    overview: null,
    systems: [],
    recent_events: []
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>("");

  const loadData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await api.monitoring.overview();
      if (res && res.overview) {
        setData({
          overview: res.overview,
          systems: res.systems || [],
          recent_events: res.recent_events || []
        });
        setLastRefreshed(new Date().toLocaleTimeString("en-IN"));
      }
    } catch (err) {
      console.error("Failed to load mission control overview:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    // Auto-refresh every 5 seconds for live telemetry
    const interval = setInterval(() => loadData(false), 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "40px 0", textAlign: "center", color: "var(--text-muted)" }}>
        <RefreshCw className="animate-spin" size={28} style={{ margin: "0 auto 12px" }} />
        <p style={{ fontSize: 13, fontFamily: "var(--font-mono)" }}>CONNECTING TO AIRBORNE TURBINE FLEET TELEMETRY...</p>
      </div>
    );
  }

  const ov = data.overview;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Top Banner Status Bar */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "rgba(0, 123, 255, 0.04)",
        border: "1px solid rgba(0, 123, 255, 0.2)",
        borderRadius: 12,
        padding: "14px 20px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 10, height: 10, borderRadius: "50%",
            background: "var(--green, #22c55e)",
            boxShadow: "0 0 10px var(--green, #22c55e)"
          }} />
          <div>
            <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Airborne Fleet Mission Control
            </span>
            <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 10 }}>
              Live Telemetry Stream Active (Refreshed: {lastRefreshed})
            </span>
          </div>
        </div>

        <button
          onClick={() => loadData(true)}
          disabled={refreshing}
          className="btn btn-ghost"
          style={{ fontSize: 11, padding: "6px 14px", display: "inline-flex", alignItems: "center", gap: 6 }}
        >
          <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
          Sync Telemetry
        </button>
      </div>

      {/* Main KPI Operational Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 14 }}>
        {/* Current Power Output */}
        <div className="source-card" style={{ padding: 18, borderLeft: "3px solid #007bff" }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)", fontSize: 11, marginBottom: 8 }}>
            <span style={{ textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>Active Power Output</span>
            <Zap size={16} color="#007bff" />
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, fontFamily: "var(--font-mono)", color: "var(--text)" }}>
            {ov?.current_power_output_kw.toFixed(1)} <span style={{ fontSize: 13, color: "var(--text-muted)" }}>kW</span>
          </div>
          <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 6 }}>
            Capacity: {ov?.rated_capacity_kw} kW Rated
          </div>
        </div>

        {/* Energy Today */}
        <div className="source-card" style={{ padding: 18, borderLeft: "3px solid #22c55e" }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)", fontSize: 11, marginBottom: 8 }}>
            <span style={{ textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>Generation Today</span>
            <TrendingUp size={16} color="#22c55e" />
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, fontFamily: "var(--font-mono)", color: "var(--text)" }}>
            {ov?.energy_generated_today_kwh.toFixed(1)} <span style={{ fontSize: 13, color: "var(--text-muted)" }}>kWh</span>
          </div>
          <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 6 }}>
            Lifetime: {ov?.energy_generated_lifetime_mwh.toFixed(1)} MWh
          </div>
        </div>

        {/* Fleet Availability */}
        <div className="source-card" style={{ padding: 18, borderLeft: "3px solid #06b6d4" }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)", fontSize: 11, marginBottom: 8 }}>
            <span style={{ textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>System Availability</span>
            <ShieldCheck size={16} color="#06b6d4" />
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, fontFamily: "var(--font-mono)", color: "var(--text)" }}>
            {ov?.system_availability_pct.toFixed(1)} <span style={{ fontSize: 13, color: "var(--text-muted)" }}>%</span>
          </div>
          <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 6 }}>
            Avg Efficiency: {ov?.system_efficiency_pct.toFixed(1)}%
          </div>
        </div>

        {/* Fleet Health */}
        <div className="source-card" style={{ padding: 18, borderLeft: "3px solid #10b981" }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)", fontSize: 11, marginBottom: 8 }}>
            <span style={{ textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>Fleet Health Score</span>
            <Activity size={16} color="#10b981" />
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, fontFamily: "var(--font-mono)", color: "var(--text)" }}>
            {ov?.fleet_health_score} <span style={{ fontSize: 13, color: "var(--text-muted)" }}>/ 100</span>
          </div>
          <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 6 }}>
            Comprehensive Diagnostics
          </div>
        </div>

        {/* Active Alerts */}
        <div
          className="source-card"
          onClick={() => onNavigateTab("alerts")}
          style={{ padding: 18, borderLeft: `3px solid ${ov?.critical_alerts ? "#ef4444" : "#f59e0b"}`, cursor: "pointer" }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)", fontSize: 11, marginBottom: 8 }}>
            <span style={{ textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>Alerts & Breaches</span>
            <AlertTriangle size={16} color={ov?.critical_alerts ? "#ef4444" : "#f59e0b"} />
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, fontFamily: "var(--font-mono)", color: ov?.critical_alerts ? "#ef4444" : "var(--text)" }}>
            {ov?.active_alerts}
          </div>
          <div style={{ fontSize: 11, color: ov?.critical_alerts ? "#ef4444" : "var(--text-secondary)", marginTop: 6 }}>
            {ov?.critical_alerts} Critical Threshold Breaches
          </div>
        </div>
      </div>

      {/* Fleet Breakdown & Current Atmospheric Conditions */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 16 }}>
        {/* Fleet Operational States Card */}
        <div className="source-card" style={{ padding: 22 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>
              Fleet Operational Deployment ({ov?.total_systems} Total Systems)
            </h3>
            <button onClick={() => onNavigateTab("systems")} className="btn btn-ghost" style={{ fontSize: 10, padding: "4px 8px" }}>
              View All <ArrowUpRight size={12} />
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            <div style={{ background: "rgba(34, 197, 94, 0.08)", border: "1px solid rgba(34, 197, 94, 0.25)", borderRadius: 8, padding: 12, textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#22c55e", fontFamily: "var(--font-mono)" }}>{ov?.online_systems}</div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4, textTransform: "uppercase", fontWeight: 600 }}>ONLINE</div>
            </div>
            <div style={{ background: "rgba(59, 130, 246, 0.08)", border: "1px solid rgba(59, 130, 246, 0.25)", borderRadius: 8, padding: 12, textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#3b82f6", fontFamily: "var(--font-mono)" }}>{ov?.standby_systems}</div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4, textTransform: "uppercase", fontWeight: 600 }}>STANDBY</div>
            </div>
            <div style={{ background: "rgba(245, 158, 11, 0.08)", border: "1px solid rgba(245, 158, 11, 0.25)", borderRadius: 8, padding: 12, textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#f59e0b", fontFamily: "var(--font-mono)" }}>{ov?.maintenance_systems}</div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4, textTransform: "uppercase", fontWeight: 600 }}>MAINTENANCE</div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginTop: 10 }}>
            <div style={{ background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.25)", borderRadius: 8, padding: 12, textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#ef4444", fontFamily: "var(--font-mono)" }}>{ov?.fault_systems}</div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4, textTransform: "uppercase", fontWeight: 600 }}>FAULT</div>
            </div>
            <div style={{ background: "rgba(107, 114, 128, 0.08)", border: "1px solid rgba(107, 114, 128, 0.25)", borderRadius: 8, padding: 12, textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#9ca3af", fontFamily: "var(--font-mono)" }}>{ov?.offline_systems}</div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4, textTransform: "uppercase", fontWeight: 600 }}>OFFLINE</div>
            </div>
          </div>
        </div>

        {/* Current Operating Atmosphere Card */}
        <div className="source-card" style={{ padding: 22 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>
              Atmospheric & High-Altitude Flight Conditions
            </h3>
            <Wind size={16} color="#06b6d4" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase" }}>Avg High-Altitude Wind</div>
              <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "var(--font-mono)", color: "var(--text)", marginTop: 4 }}>
                {ov?.operating_conditions.average_wind_speed_ms} <span style={{ fontSize: 12, color: "var(--text-muted)" }}>m/s</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase" }}>Ambient Ground Temp</div>
              <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "var(--font-mono)", color: "var(--text)", marginTop: 4 }}>
                {ov?.operating_conditions.ambient_temperature_c} <span style={{ fontSize: 12, color: "var(--text-muted)" }}>°C</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase" }}>Air Density Estimation</div>
              <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "var(--font-mono)", color: "var(--text)", marginTop: 4 }}>
                {ov?.operating_conditions.air_density_kg_m3} <span style={{ fontSize: 12, color: "var(--text-muted)" }}>kg/m³</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase" }}>Atmospheric Stream</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#06b6d4", marginTop: 8 }}>
                {ov?.operating_conditions.weather_summary}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Systems Status Table with Quick Operational Access */}
      <div className="source-card" style={{ padding: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>
              Live Airborne Wind Energy Systems
            </h3>
            <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "4px 0 0" }}>
              Click any system row to open its complete operational detail view & telemetry charts
            </p>
          </div>
          <button onClick={() => onNavigateTab("systems")} className="btn btn-ghost" style={{ fontSize: 11 }}>
            Fleet Systems Catalog →
          </button>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="source-table" style={{ width: "100%", fontSize: 12 }}>
            <thead>
              <tr>
                <th>System ID</th>
                <th>Model</th>
                <th>Location</th>
                <th>Rated Capacity</th>
                <th>Current Output</th>
                <th>Today Energy</th>
                <th>Availability</th>
                <th>Status</th>
                <th>Health</th>
                <th style={{ textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {data.systems.map((s) => (
                <tr
                  key={s.id}
                  onClick={() => onSelectSystem(s)}
                  style={{ cursor: "pointer" }}
                  className="table-row-hover"
                >
                  <td style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--accent, #007bff)" }}>
                    {s.id}
                  </td>
                  <td style={{ fontWeight: 600 }}>{s.model}</td>
                  <td style={{ color: "var(--text-secondary)", fontSize: 11 }}>{s.location}</td>
                  <td style={{ fontFamily: "var(--font-mono)" }}>{s.rated_power_kw} kW</td>
                  <td style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: s.current_power_kw > 0 ? "#22c55e" : "var(--text-muted)" }}>
                    {s.current_power_kw.toFixed(1)} kW
                  </td>
                  <td style={{ fontFamily: "var(--font-mono)" }}>{s.energy_today_kwh.toFixed(1)} kWh</td>
                  <td style={{ fontFamily: "var(--font-mono)" }}>{s.availability_pct.toFixed(1)}%</td>
                  <td>
                    <span style={{
                      padding: "3px 8px",
                      borderRadius: 4,
                      fontSize: 10,
                      fontWeight: 700,
                      fontFamily: "var(--font-mono)",
                      background: s.status === "ONLINE" ? "rgba(34,197,94,0.15)" : s.status === "FAULT" ? "rgba(239,68,68,0.15)" : "rgba(245,158,11,0.15)",
                      color: s.status === "ONLINE" ? "#22c55e" : s.status === "FAULT" ? "#ef4444" : "#f59e0b"
                    }}>
                      {s.status}
                    </span>
                  </td>
                  <td>
                    <span style={{
                      padding: "3px 8px",
                      borderRadius: 4,
                      fontSize: 10,
                      fontWeight: 700,
                      background: s.health_status === "GOOD" ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
                      color: s.health_status === "GOOD" ? "#10b981" : "#ef4444"
                    }}>
                      {s.health_status}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); onSelectSystem(s); }}
                      className="btn btn-ghost"
                      style={{ padding: "4px 8px", fontSize: 11 }}
                    >
                      Open Detail →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Operational Events Audit Log */}
      <div className="source-card" style={{ padding: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>
            Recent Operational Events & Autopilot Transitions
          </h3>
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Last 8 Events</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {data.recent_events.map((ev, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 14px",
                background: "rgba(255, 255, 255, 0.02)",
                border: "1px solid var(--border)",
                borderRadius: 8
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{
                  fontSize: 10,
                  fontFamily: "var(--font-mono)",
                  padding: "2px 6px",
                  borderRadius: 4,
                  background: ev.severity === "CRITICAL" ? "rgba(239,68,68,0.2)" : ev.severity === "WARNING" ? "rgba(245,158,11,0.2)" : "rgba(59,130,246,0.2)",
                  color: ev.severity === "CRITICAL" ? "#ef4444" : ev.severity === "WARNING" ? "#f59e0b" : "#3b82f6",
                  fontWeight: 700
                }}>
                  {ev.event_type}
                </span>
                <span style={{ fontSize: 12, color: "var(--text)" }}>{ev.description}</span>
                {ev.system_id && (
                  <span style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                    [{ev.system_id}]
                  </span>
                )}
              </div>
              <span style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                {new Date(ev.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

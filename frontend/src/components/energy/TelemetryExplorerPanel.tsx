"use client";
import React, { useState, useEffect } from "react";
import {
  Download, Filter, RefreshCw, BarChart2, Zap, Wind,
  Activity, Gauge, TrendingUp, Calendar, ArrowDown
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from "recharts";
import { api } from "@/lib/api";
import type { EnergySystem, TelemetryRecord } from "@/types";

export function TelemetryExplorerPanel() {
  const [systems, setSystems] = useState<EnergySystem[]>([]);
  const [selectedSystemId, setSelectedSystemId] = useState<string>("SYS-X1-001");
  const [selectedMetric, setSelectedMetric] = useState<string>("power_output_kw");
  const [timeRange, setTimeRange] = useState<"1h" | "24h" | "7d" | "30d">("24h");
  const [telemetry, setTelemetry] = useState<TelemetryRecord[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Load available systems
  useEffect(() => {
    api.energySystems.list().then(res => {
      if (res && res.data && res.data.length > 0) {
        setSystems(res.data);
        if (!selectedSystemId) setSelectedSystemId(res.data[0].id);
      }
    });
  }, []);

  // Load telemetry for selected system and range
  const loadTelemetry = async () => {
    if (!selectedSystemId) return;
    setLoading(true);
    try {
      const res = await api.energySystems.telemetry(selectedSystemId, timeRange);
      if (res && res.data) {
        setTelemetry(res.data);
        setStats(res.stats);
      }
    } catch (err) {
      console.error("Failed to load telemetry:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTelemetry();
  }, [selectedSystemId, timeRange]);

  const METRIC_CONFIG: Record<string, { label: string; unit: string; color: string; key: keyof TelemetryRecord }> = {
    power_output_kw: { label: "Power Output", unit: "kW", color: "#007bff", key: "power_output_kw" },
    wind_speed_ms: { label: "Wind Speed", unit: "m/s", color: "#06b6d4", key: "wind_speed_ms" },
    tether_tension_kn: { label: "Dynamic Tether Tension", unit: "kN", color: "#8b5cf6", key: "tether_tension_kn" },
    rotor_rpm: { label: "Airborne Rotor RPM", unit: "RPM", color: "#10b981", key: "rotor_rpm" },
    voltage_v: { label: "Bus Voltage", unit: "V", color: "#f59e0b", key: "voltage_v" },
    current_a: { label: "Inverter Current", unit: "A", color: "#ec4899", key: "current_a" },
    flight_altitude_m: { label: "Flight Altitude", unit: "m", color: "#eab308", key: "flight_altitude_m" },
    temperature_c: { label: "Stator Temperature", unit: "°C", color: "#ef4444", key: "temperature_c" }
  };

  const currentMetricConfig = METRIC_CONFIG[selectedMetric] || METRIC_CONFIG.power_output_kw;

  const chartData = telemetry.map(t => ({
    time: new Date(t.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    value: Number((t[currentMetricConfig.key] as number || 0).toFixed(2))
  }));

  const exportCSV = () => {
    if (telemetry.length === 0) return;
    const headers = "id,system_id,timestamp,power_output_kw,voltage_v,current_a,wind_speed_ms,tether_tension_kn,rotor_rpm,altitude_m,temperature_c\n";
    const rows = telemetry.map(t =>
      `${t.id},${t.system_id},"${t.timestamp}",${t.power_output_kw},${t.voltage_v},${t.current_a},${t.wind_speed_ms},${t.tether_tension_kn},${t.rotor_rpm},${t.flight_altitude_m},${t.temperature_c}`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `telemetry_${selectedSystemId}_${timeRange}.csv`;
    a.click();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Control Bar: System, Metric, Range Selection */}
      <div className="source-card" style={{ padding: 18 }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12 }}>
            {/* System Selector */}
            <div>
              <label style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: 4, fontWeight: 700 }}>
                Energy System
              </label>
              <select
                className="source-input"
                value={selectedSystemId}
                onChange={e => setSelectedSystemId(e.target.value)}
                style={{ padding: "6px 12px", fontSize: 12, width: 220, fontFamily: "var(--font-mono)" }}
              >
                {systems.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.id} — {s.model}
                  </option>
                ))}
              </select>
            </div>

            {/* Metric Selector */}
            <div>
              <label style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: 4, fontWeight: 700 }}>
                Telemetry Metric
              </label>
              <select
                className="source-input"
                value={selectedMetric}
                onChange={e => setSelectedMetric(e.target.value)}
                style={{ padding: "6px 12px", fontSize: 12, width: 220 }}
              >
                {Object.entries(METRIC_CONFIG).map(([k, cfg]) => (
                  <option key={k} value={k}>
                    {cfg.label} ({cfg.unit})
                  </option>
                ))}
              </select>
            </div>

            {/* Time Range Selector */}
            <div>
              <label style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: 4, fontWeight: 700 }}>
                Time Range
              </label>
              <div style={{ display: "flex", gap: 6 }}>
                {(["1h", "24h", "7d", "30d"] as const).map(r => (
                  <button
                    key={r}
                    onClick={() => setTimeRange(r)}
                    style={{
                      padding: "6px 12px",
                      fontSize: 11,
                      fontWeight: 700,
                      borderRadius: 4,
                      border: "1px solid var(--border)",
                      background: timeRange === r ? "var(--accent, #007bff)" : "transparent",
                      color: timeRange === r ? "#fff" : "var(--text-muted)",
                      cursor: "pointer"
                    }}
                  >
                    {r.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
            <button
              onClick={exportCSV}
              disabled={telemetry.length === 0}
              className="btn btn-ghost"
              style={{ fontSize: 11, padding: "8px 14px", display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <Download size={13} />
              Export CSV
            </button>
            <button
              onClick={loadTelemetry}
              className="btn btn-primary"
              style={{ fontSize: 11, padding: "8px 14px", display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Metric Statistics Strip */}
      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
          <div className="source-card" style={{ padding: 14 }}>
            <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase" }}>Current Value</div>
            <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "var(--font-mono)", color: "var(--text)", marginTop: 4 }}>
              {chartData.length > 0 ? chartData[chartData.length - 1].value : 0} {currentMetricConfig.unit}
            </div>
          </div>
          <div className="source-card" style={{ padding: 14 }}>
            <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase" }}>Window Minimum</div>
            <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "var(--font-mono)", color: "#06b6d4", marginTop: 4 }}>
              {chartData.length > 0 ? Math.min(...chartData.map(c => c.value)) : 0} {currentMetricConfig.unit}
            </div>
          </div>
          <div className="source-card" style={{ padding: 14 }}>
            <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase" }}>Window Maximum</div>
            <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "var(--font-mono)", color: "#ef4444", marginTop: 4 }}>
              {chartData.length > 0 ? Math.max(...chartData.map(c => c.value)) : 0} {currentMetricConfig.unit}
            </div>
          </div>
          <div className="source-card" style={{ padding: 14 }}>
            <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase" }}>Data Points Logged</div>
            <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "var(--font-mono)", color: "#10b981", marginTop: 4 }}>
              {telemetry.length} Points
            </div>
          </div>
        </div>
      )}

      {/* Main Interactive Chart */}
      <div className="source-card" style={{ padding: 22 }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 16px" }}>
          {currentMetricConfig.label} ({currentMetricConfig.unit}) — Time Series ({timeRange.toUpperCase()})
        </h3>

        <div style={{ height: 320, width: "100%" }}>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="metricGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={currentMetricConfig.color} stopOpacity={0.4}/>
                    <stop offset="95%" stopColor={currentMetricConfig.color} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="time" stroke="var(--text-muted)" fontSize={10} />
                <YAxis stroke="var(--text-muted)" fontSize={10} unit={` ${currentMetricConfig.unit}`} />
                <Tooltip contentStyle={{ background: "var(--bg-card, #121824)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 11 }} />
                <Area type="monotone" dataKey="value" name={currentMetricConfig.label} stroke={currentMetricConfig.color} strokeWidth={2} fill="url(#metricGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: "center", padding: "100px 0", color: "var(--text-muted)" }}>
              No telemetry data available for this range.
            </div>
          )}
        </div>
      </div>

      {/* Raw Historical Telemetry Table */}
      <div className="source-card" style={{ padding: 22 }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 14px" }}>
          Raw Telemetry Ingestion Log
        </h3>
        <div style={{ overflowX: "auto", maxHeight: 320 }}>
          <table className="source-table" style={{ width: "100%", fontSize: 11 }}>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Power Output</th>
                <th>Wind Speed</th>
                <th>Tension</th>
                <th>Rotor RPM</th>
                <th>Altitude</th>
                <th>Voltage</th>
                <th>Current</th>
                <th>Temp</th>
              </tr>
            </thead>
            <tbody>
              {telemetry.slice(-30).reverse().map(t => (
                <tr key={t.id}>
                  <td style={{ fontFamily: "var(--font-mono)" }}>
                    {new Date(t.timestamp).toLocaleString("en-IN")}
                  </td>
                  <td style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "#22c55e" }}>
                    {t.power_output_kw.toFixed(2)} kW
                  </td>
                  <td style={{ fontFamily: "var(--font-mono)" }}>{t.wind_speed_ms.toFixed(1)} m/s</td>
                  <td style={{ fontFamily: "var(--font-mono)" }}>{t.tether_tension_kn.toFixed(1)} kN</td>
                  <td style={{ fontFamily: "var(--font-mono)" }}>{t.rotor_rpm} RPM</td>
                  <td style={{ fontFamily: "var(--font-mono)" }}>{t.flight_altitude_m} m</td>
                  <td style={{ fontFamily: "var(--font-mono)" }}>{t.voltage_v.toFixed(1)} V</td>
                  <td style={{ fontFamily: "var(--font-mono)" }}>{t.current_a.toFixed(1)} A</td>
                  <td style={{ fontFamily: "var(--font-mono)" }}>{t.temperature_c.toFixed(1)} °C</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

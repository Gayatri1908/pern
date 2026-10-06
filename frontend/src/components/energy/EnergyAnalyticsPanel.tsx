"use client";
import React, { useState, useEffect } from "react";
import {
  TrendingUp, BarChart3, Zap, Wind, ShieldCheck,
  Calendar, RefreshCw, Leaf, Home, Award
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { api } from "@/lib/api";

export function EnergyAnalyticsPanel() {
  const [period, setPeriod] = useState<string>("7d");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const res = await api.analytics.energyAnalytics(undefined, period);
      if (res && res.summary) {
        setData(res);
      }
    } catch (err) {
      console.error("Failed to load energy analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const summary = data?.summary;
  const dailyGen = data?.daily_generation || [];
  const systemComp = data?.system_comparison || [];
  const hourly = data?.hourly_profile || [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Top Filter and Period Toggle */}
      <div className="source-card" style={{ padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>
              Industrial Renewable Energy Analytics
            </h3>
            <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "4px 0 0" }}>
              Airborne wind turbine generation yields, capacity utilization factor, and environmental metrics
            </p>
          </div>

          <div style={{ display: "flex", gap: 6 }}>
            {(["24h", "7d", "30d", "1y"] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                style={{
                  padding: "6px 14px",
                  fontSize: 11,
                  fontWeight: 700,
                  borderRadius: 4,
                  border: "1px solid var(--border)",
                  background: period === p ? "var(--accent, #007bff)" : "transparent",
                  color: period === p ? "#fff" : "var(--text-muted)",
                  cursor: "pointer"
                }}
              >
                {p.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 14 }}>
        <div className="source-card" style={{ padding: 18, borderLeft: "3px solid #22c55e" }}>
          <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Total Period Generation</div>
          <div style={{ fontSize: 26, fontWeight: 800, fontFamily: "var(--font-mono)", color: "var(--text)", marginTop: 4 }}>
            {summary?.total_energy_kwh?.toLocaleString() || "0"} <span style={{ fontSize: 13, color: "var(--text-muted)" }}>kWh</span>
          </div>
          <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 4 }}>
            Yield: {summary?.total_energy_mwh || "0.0"} MWh Total
          </div>
        </div>

        <div className="source-card" style={{ padding: 18, borderLeft: "3px solid #007bff" }}>
          <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Peak Fleet Power</div>
          <div style={{ fontSize: 26, fontWeight: 800, fontFamily: "var(--font-mono)", color: "var(--text)", marginTop: 4 }}>
            {summary?.peak_power_kw || "0.0"} <span style={{ fontSize: 13, color: "var(--text-muted)" }}>kW</span>
          </div>
          <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 4 }}>
            Max Instantaneous Generation
          </div>
        </div>

        <div className="source-card" style={{ padding: 18, borderLeft: "3px solid #06b6d4" }}>
          <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Capacity Factor (CUF)</div>
          <div style={{ fontSize: 26, fontWeight: 800, fontFamily: "var(--font-mono)", color: "#06b6d4", marginTop: 4 }}>
            {summary?.capacity_utilization_pct || "0.0"}%
          </div>
          <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 4 }}>
            High-Altitude Capacity Factor
          </div>
        </div>

        <div className="source-card" style={{ padding: 18, borderLeft: "3px solid #10b981" }}>
          <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>CO2 Offsets</div>
          <div style={{ fontSize: 26, fontWeight: 800, fontFamily: "var(--font-mono)", color: "#10b981", marginTop: 4 }}>
            {summary?.estimated_co2_offset_tonnes || "0.0"} <span style={{ fontSize: 13, color: "var(--text-muted)" }}>t</span>
          </div>
          <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 4 }}>
            Tonnes CO2 Avoided
          </div>
        </div>
      </div>

      {/* Generation Trend & System Comparison Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(440px, 1fr))", gap: 16 }}>
        {/* Daily Generation Yields */}
        <div className="source-card" style={{ padding: 22 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 16px" }}>
            Daily Generation Output (kWh)
          </h3>
          <div style={{ height: 260, width: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyGen}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={10} />
                <YAxis stroke="var(--text-muted)" fontSize={10} unit=" kWh" />
                <Tooltip contentStyle={{ background: "var(--bg-card, #121824)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 11 }} />
                <Bar dataKey="total_kwh" name="Energy Output (kWh)" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Diurnal Hourly Profile (Wind vs Power) */}
        <div className="source-card" style={{ padding: 22 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 16px" }}>
            Hourly Generation Profile (Wind Speed vs Generation)
          </h3>
          <div style={{ height: 260, width: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hourly}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="hour" stroke="var(--text-muted)" fontSize={10} />
                <YAxis yAxisId="left" stroke="var(--text-muted)" fontSize={10} unit=" kW" />
                <YAxis yAxisId="right" orientation="right" stroke="var(--text-muted)" fontSize={10} unit=" m/s" />
                <Tooltip contentStyle={{ background: "var(--bg-card, #121824)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 11 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line yAxisId="left" type="monotone" dataKey="power" name="Power Output (kW)" stroke="#007bff" strokeWidth={2} dot={{ r: 3 }} />
                <Line yAxisId="right" type="monotone" dataKey="wind" name="Wind Speed (m/s)" stroke="#06b6d4" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* System Comparative Yields Table */}
      <div className="source-card" style={{ padding: 22 }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 14px" }}>
          Fleet Model Generation Yields & Capacity Utilization
        </h3>
        <div style={{ overflowX: "auto" }}>
          <table className="source-table" style={{ width: "100%", fontSize: 12 }}>
            <thead>
              <tr>
                <th>System</th>
                <th>Model</th>
                <th>Rated Capacity</th>
                <th>Period Generation</th>
                <th>Peak Output</th>
                <th>Availability</th>
                <th>Efficiency</th>
              </tr>
            </thead>
            <tbody>
              {systemComp.map((s: any) => (
                <tr key={s.id}>
                  <td style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--accent, #007bff)" }}>
                    {s.id}
                  </td>
                  <td style={{ fontWeight: 600 }}>{s.model}</td>
                  <td style={{ fontFamily: "var(--font-mono)" }}>{s.rated_power_kw} kW</td>
                  <td style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "#22c55e" }}>
                    {s.period_kwh ? s.period_kwh.toFixed(1) : "0.0"} kWh
                  </td>
                  <td style={{ fontFamily: "var(--font-mono)" }}>{s.peak_kw ? s.peak_kw.toFixed(1) : "0.0"} kW</td>
                  <td style={{ fontFamily: "var(--font-mono)" }}>{s.availability_pct}%</td>
                  <td style={{ fontFamily: "var(--font-mono)" }}>{s.efficiency_pct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

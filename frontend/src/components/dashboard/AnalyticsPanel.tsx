"use client";
// ============================================================
// AnalyticsPanel — multi-period energy charts + efficiency stats
// ============================================================
import React, { useEffect, useState, useCallback } from "react";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { Download, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";
import type { Product } from "@/types";

interface Props { products: Product[]; }

type Period = "hourly" | "daily" | "monthly" | "yearly";

const PERIODS: { id: Period; label: string }[] = [
  { id: "hourly", label: "Hourly" },
  { id: "daily", label: "Daily" },
  { id: "monthly", label: "Monthly" },
  { id: "yearly", label: "Yearly" },
];

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#0e1826", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 12px", fontSize: 11 }}>
      <p style={{ color: "var(--text-muted)", marginBottom: 4 }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: "var(--accent)", fontWeight: 600 }}>
          {p.value.toFixed(2)} kWh
        </p>
      ))}
    </div>
  );
}

export function AnalyticsPanel({ products }: Props) {
  const [period, setPeriod] = useState<Period>("daily");
  const [productFilter, setProductFilter] = useState<string>("all");
  const [chartData, setChartData] = useState<{ time: string; kwh: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState<"area" | "bar">("area");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.analytics.energyChart(period, productFilter !== "all" ? productFilter : undefined) as { time: string; kwh: number }[];
      setChartData(Array.isArray(data) ? data : []);
    } catch {
      setChartData([]);
    } finally { setLoading(false); }
  }, [period, productFilter]);

  useEffect(() => { load(); }, [load]);

  const totalKwh = chartData.reduce((acc, d) => acc + d.kwh, 0);
  const peakKwh = Math.max(...chartData.map(d => d.kwh), 0);
  const avgKwh = chartData.length ? totalKwh / chartData.length : 0;

  return (
    <div className="animate-slide-up" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, letterSpacing: "0.04em", textTransform: "uppercase" }}>
          Energy Analytics
        </h2>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={load}>
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => {
            const csv = ["time,kwh", ...chartData.map(d => `${d.time},${d.kwh.toFixed(2)}`)].join("\n");
            const blob = new Blob([csv], { type: "text/csv" });
            const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
            a.download = `energy_${period}_${new Date().toISOString().slice(0,10)}.csv`; a.click();
          }}>
            <Download size={12} /> Export CSV
          </button>
        </div>
      </div>

      {/* Stat chips */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {[
          { label: "Total Output", val: `${totalKwh.toFixed(1)} kWh`, color: "var(--accent)" },
          { label: "Peak Period", val: `${peakKwh.toFixed(1)} kWh`, color: "var(--warning)" },
          { label: "Average", val: `${avgKwh.toFixed(1)} kWh/${period === "hourly" ? "hr" : period === "daily" ? "day" : "month"}`, color: "var(--green)" },
        ].map(s => (
          <div key={s.label} className="source-card" style={{ padding: "12px 18px", display: "flex", flexDirection: "column", gap: 2 }}>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</p>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, color: s.color }}>{s.val}</p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        {PERIODS.map(p => (
          <button key={p.id} onClick={() => setPeriod(p.id)} className={`btn btn-sm ${period === p.id ? "btn-primary" : "btn-ghost"}`}>
            {p.label}
          </button>
        ))}
        <span style={{ flex: 1 }} />
        <select className="source-input" style={{ width: "auto", height: 32, padding: "4px 10px", fontSize: 11 }}
          value={productFilter} onChange={e => setProductFilter(e.target.value)}>
          <option value="all">All Products</option>
          {products.map(p => <option key={p.id} value={p.id}>{p.product_code}</option>)}
        </select>
        <button onClick={() => setChartType(t => t === "area" ? "bar" : "area")} className="btn btn-ghost btn-sm">
          {chartType === "area" ? "Bar Chart" : "Area Chart"}
        </button>
      </div>

      {/* Chart */}
      <div className="source-card" style={{ padding: 20 }}>
        {loading ? (
          <div style={{ height: 280, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: 12 }}>
            <RefreshCw size={16} className="animate-spin" style={{ marginRight: 8 }} />
            Loading chart data...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            {chartType === "area" ? (
              <AreaChart data={chartData} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="aGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: "var(--text-muted)", fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "var(--text-muted)", fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="kwh" stroke="var(--accent)" strokeWidth={2} fill="url(#aGrad)" dot={false} />
              </AreaChart>
            ) : (
              <BarChart data={chartData} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: "var(--text-muted)", fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "var(--text-muted)", fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="kwh" fill="var(--accent)" opacity={0.8} radius={[3, 3, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

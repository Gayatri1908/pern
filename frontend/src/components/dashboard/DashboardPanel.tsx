"use client";
// ============================================================
// DashboardPanel — main overview with KPIs, energy chart, weather
// ============================================================
import React, { useEffect, useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, LineChart, Line, Legend
} from "recharts";
import {
  Cpu, Users, AlertTriangle, Wind, Zap, Leaf,
  Activity, TrendingUp, Clock, CheckCircle, XCircle, Wrench
} from "lucide-react";
import { KpiCard } from "@/components/ui/KpiCard";
import type { AnalyticsSummary, Product } from "@/types";
import { api } from "@/lib/api";

interface WeatherCardProps {
  data: { wind_speed_ms: number; temperature_c: number; humidity_pct: number; condition: string } | null;
}

function WeatherCard({ data }: WeatherCardProps) {
  return (
    <div className="source-card" style={{ padding: 20 }}>
      <p style={{
        fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700,
        letterSpacing: "0.1em", textTransform: "uppercase",
        color: "var(--text-muted)", marginBottom: 14
      }}>
        Live Weather
      </p>
      {!data ? (
        <p style={{ color: "var(--text-muted)", fontSize: 12 }}>Weather data unavailable</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[
            { label: "Wind Speed", val: `${data.wind_speed_ms.toFixed(1)} m/s`, icon: <Wind size={13} color="var(--accent)" /> },
            { label: "Temperature", val: `${data.temperature_c.toFixed(1)} °C`, icon: <Activity size={13} color="var(--warning)" /> },
            { label: "Humidity", val: `${data.humidity_pct.toFixed(0)}%`, icon: <Activity size={13} color="var(--green)" /> },
            { label: "Condition", val: data.condition, icon: <CheckCircle size={13} color="var(--green)" /> },
          ].map(row => (
            <div key={row.label} style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid var(--border)",
              borderRadius: 10, padding: "10px 12px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
                {row.icon}
                <span style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  {row.label}
                </span>
              </div>
              <p style={{ fontSize: 14, fontWeight: 700, fontFamily: "var(--font-display)", color: "var(--text)" }}>
                {row.val}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; name: string }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#0e1826", border: "1px solid var(--border)",
      borderRadius: 8, padding: "8px 12px",
      fontFamily: "var(--font-body)", fontSize: 11
    }}>
      <p style={{ color: "var(--text-muted)", marginBottom: 4 }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: "var(--accent)", fontWeight: 600 }}>
          {p.name}: {p.value.toFixed(2)}
        </p>
      ))}
    </div>
  );
}

interface Props {
  summary: AnalyticsSummary | null;
  summaryLoading: boolean;
  role?: string | null;
  products?: Product[];
}

export function DashboardPanel({ summary, summaryLoading, role, products = [] }: Props) {
  const [chartData, setChartData] = useState<{ time: string; kwh: number }[]>([]);
  const [weather, setWeather] = useState<{ wind_speed_ms: number; temperature_c: number; humidity_pct: number; condition: string } | null>(null);

  useEffect(() => {
    api.analytics.energyChart("hourly").then((data: unknown) => {
      if (Array.isArray(data) && data.length > 0) {
        setChartData(data as { time: string; kwh: number }[]);
      } else {
        const empty = Array.from({ length: 24 }, (_, i) => ({
          time: `${String(i).padStart(2, "0")}:00`,
          kwh: 0,
        }));
        setChartData(empty);
      }
    }).catch(() => {
      const empty = Array.from({ length: 24 }, (_, i) => ({
        time: `${String(i).padStart(2, "0")}:00`,
        kwh: 0,
      }));
      setChartData(empty);
    });

    const lat = products.length > 0 && products[0].install_lat ? products[0].install_lat : 18.5204;
    const lng = products.length > 0 && products[0].install_lng ? products[0].install_lng : 73.8567;
    
    api.weather.current(lat, lng).then((w: unknown) => {
      setWeather(w as { wind_speed_ms: number; temperature_c: number; humidity_pct: number; condition: string });
    }).catch(() => {});
  }, [products]);

  const isAdmin = role === "Admin";

  const evStations = products.filter((p: any) => 
    p.category === "ev_charging_hub" || 
    p.category === "battery_storage_station" || 
    p.station_name !== null
  );

  const totalStations = evStations.length;
  const activeStations = evStations.filter(s => s.status === "online").length;
  const avgBatteryHealth = evStations.length 
    ? (evStations.reduce((acc, s) => acc + (s.battery_health || 0), 0) / evStations.length) 
    : 0;
  const availableChargers = evStations.reduce((acc, s) => acc + (s.available_ports || 0), 0);

  const allKpis = [
    { label: "Total Products", value: summary?.total_products ?? "—", icon: <Cpu size={16} />, accent: "blue" as const, sub: `${summary?.online_products ?? 0} online`, href: role === "Customer" ? "#my_products" : "#products-all" },
    { label: "Online Now", value: summary?.online_products ?? "—", icon: <Activity size={16} />, accent: "green" as const, sub: `${summary?.offline_products ?? 0} offline`, href: role === "Customer" ? "#my_products" : "#products-online" },
    { label: "Failed Devices", value: summary?.failed_products ?? "—", icon: <XCircle size={16} />, accent: "error" as const, sub: "Needs attention", href: role === "Customer" ? "#my_products" : "#products-failed" },
    { label: "Under Maintenance", value: summary?.maintenance_products ?? "—", icon: <Wrench size={16} />, accent: "warn" as const, sub: "Scheduled service", href: role === "Customer" ? "#my_products" : "#products-maintenance" },
    { label: "Total Users", value: summary?.total_users ?? "—", icon: <Users size={16} />, accent: "blue" as const, sub: `${summary?.pending_requests ?? 0} pending requests`, adminOnly: true, href: "#users" },
    { label: "Critical Alerts", value: summary?.critical_alerts ?? "—", icon: <AlertTriangle size={16} />, accent: "error" as const, sub: `${summary?.open_complaints ?? 0} open complaints`, href: "#alerts" },
    { label: "EV Stations", value: totalStations, icon: <Cpu size={16} />, accent: "blue" as const, sub: `${activeStations} online / ${availableChargers} ports avail`, href: "#monitoring" },
    { label: "Avg Battery Health", value: `${avgBatteryHealth.toFixed(1)}%`, icon: <Leaf size={16} />, accent: "green" as const, sub: "EV Fleet average", href: "#monitoring" },
    { label: "Today's Energy", value: summary?.today_energy_kwh !== undefined ? `${summary.today_energy_kwh.toFixed(1)} kWh` : "—", icon: <Zap size={16} />, accent: "green" as const, sub: "Fleet aggregate", href: "#analytics" },
    { label: "Monthly Output", value: summary?.month_energy_kwh !== undefined ? `${(summary.month_energy_kwh / 1000).toFixed(2)} MWh` : "—", icon: <TrendingUp size={16} />, accent: "blue" as const, sub: "Current month", href: "#analytics" },
    { label: "Lifetime Yield", value: summary?.lifetime_energy_kwh !== undefined ? `${(summary.lifetime_energy_kwh / 1000).toFixed(1)} MWh` : "—", icon: <Clock size={16} />, accent: "blue" as const, sub: "All time", href: "#analytics" },
    { label: "CO₂ Saved", value: summary?.co2_saved_kg !== undefined ? `${(summary.co2_saved_kg / 1000).toFixed(2)} T` : "—", icon: <Leaf size={16} />, accent: "green" as const, sub: "Lifetime emission offset", href: "#analytics" },
  ];

  const kpis = allKpis.filter(kpi => !kpi.adminOnly || isAdmin);

  return (
    <div className="animate-slide-up" style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* KPI Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
        {kpis.map(kpi => (
          <KpiCard
            key={kpi.label}
            label={kpi.label}
            value={kpi.value}
            sub={kpi.sub}
            icon={kpi.icon}
            accent={kpi.accent}
            loading={summaryLoading}
            href={kpi.href}
          />
        ))}
      </div>

      {/* Energy Chart + Weather */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16 }}>
        <div className="source-card" style={{ padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <p style={{
                fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700,
                letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)"
              }}>
                Energy Generation — Hourly
              </p>
              <p style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, color: "var(--text)", marginTop: 2 }}>
                Today's Production Curve
              </p>
            </div>
            <span className="badge badge-online">
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)", animation: "pulse-dot 2.2s ease-in-out infinite" }} />
              Live
            </span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="energyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: "var(--text-muted)", fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "var(--text-muted)", fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="kwh"
                name="Energy"
                stroke="var(--accent)"
                strokeWidth={2}
                fill="url(#energyGrad)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <WeatherCard data={weather} />
      </div>
    </div>
  );
}

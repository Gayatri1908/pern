"use client";
import React, { useState, useEffect } from "react";
import {
  Search, Filter, Zap, Wind, ShieldCheck, AlertTriangle,
  ArrowUpRight, RefreshCw, Cpu, Activity
} from "lucide-react";
import { api } from "@/lib/api";
import type { EnergySystem, SystemOperatingStatus } from "@/types";
import { EnergySystemDetailModal } from "./EnergySystemDetailModal";

interface EnergySystemsPanelProps {
  onSelectSystem?: (system: EnergySystem) => void;
}

export function EnergySystemsPanel({ onSelectSystem }: EnergySystemsPanelProps) {
  const [systems, setSystems] = useState<EnergySystem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [modelFilter, setModelFilter] = useState<string>("ALL");
  const [search, setSearch] = useState<string>("");
  const [selectedSystem, setSelectedSystem] = useState<EnergySystem | null>(null);

  const loadSystems = async () => {
    try {
      const params: Record<string, string> = {};
      if (statusFilter !== "ALL") params.status = statusFilter;
      if (modelFilter !== "ALL") params.model = modelFilter;
      if (search.trim()) params.search = search.trim();

      const res = await api.energySystems.list(params);
      if (res && res.data) {
        setSystems(res.data);
      }
    } catch (err) {
      console.error("Failed to load energy systems:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSystems();
  }, [statusFilter, modelFilter, search]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Top Filter and Search Bar */}
      <div className="source-card" style={{ padding: 16 }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
          {/* Search Box */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 260 }}>
            <div style={{ position: "relative", width: "100%" }}>
              <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input
                className="source-input"
                type="text"
                placeholder="Search by System ID, Name, Model, or Location..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ paddingLeft: 34 }}
              />
            </div>
          </div>

          {/* Status & Model Filter Dropdowns */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Filter size={13} color="var(--text-muted)" />
              <select
                className="source-input"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                style={{ padding: "6px 10px", fontSize: 12, width: 140 }}
              >
                <option value="ALL">All Statuses</option>
                <option value="ONLINE">ONLINE</option>
                <option value="STANDBY">STANDBY</option>
                <option value="MAINTENANCE">MAINTENANCE</option>
                <option value="FAULT">FAULT</option>
                <option value="OFFLINE">OFFLINE</option>
              </select>
            </div>

            <select
              className="source-input"
              value={modelFilter}
              onChange={e => setModelFilter(e.target.value)}
              style={{ padding: "6px 10px", fontSize: 12, width: 180 }}
            >
              <option value="ALL">All Models</option>
              <option value="Airborne Wind Turbine X1">Airborne Wind Turbine X1</option>
              <option value="Ember 20M">Ember 20M</option>
              <option value="Micro-Tether C3">Micro-Tether C3</option>
              <option value="Offshore MegaKite V9">Offshore MegaKite V9</option>
            </select>

            <button
              onClick={() => { setSearch(""); setStatusFilter("ALL"); setModelFilter("ALL"); }}
              className="btn btn-ghost"
              style={{ fontSize: 11, padding: "6px 12px" }}
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Systems Grid */}
      {loading ? (
        <div style={{ padding: "60px 0", textAlign: "center", color: "var(--text-muted)" }}>
          <RefreshCw className="animate-spin" size={24} style={{ margin: "0 auto 10px" }} />
          <p style={{ fontSize: 12 }}>Loading airborne energy systems from database...</p>
        </div>
      ) : systems.length === 0 ? (
        <div className="source-card" style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>
          <Cpu size={32} style={{ margin: "0 auto 12px", opacity: 0.4 }} />
          <p style={{ fontSize: 13, fontWeight: 600 }}>No energy systems match your filter criteria.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
          {systems.map(s => (
            <div
              key={s.id}
              className="source-card"
              onClick={() => {
                setSelectedSystem(s);
                if (onSelectSystem) onSelectSystem(s);
              }}
              style={{
                padding: 20,
                cursor: "pointer",
                borderLeft: `4px solid ${
                  s.status === "ONLINE" ? "#22c55e" : s.status === "FAULT" ? "#ef4444" : s.status === "MAINTENANCE" ? "#f59e0b" : "#3b82f6"
                }`,
                display: "flex",
                flexDirection: "column",
                gap: 14
              }}
            >
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 14, color: "var(--accent, #007bff)" }}>
                      {s.id}
                    </span>
                    <span style={{
                      padding: "2px 6px",
                      borderRadius: 4,
                      fontSize: 9,
                      fontWeight: 700,
                      fontFamily: "var(--font-mono)",
                      background: s.status === "ONLINE" ? "rgba(34,197,94,0.15)" : s.status === "FAULT" ? "rgba(239,68,68,0.15)" : "rgba(245,158,11,0.15)",
                      color: s.status === "ONLINE" ? "#22c55e" : s.status === "FAULT" ? "#ef4444" : "#f59e0b"
                    }}>
                      {s.status}
                    </span>
                  </div>
                  <h4 style={{ fontSize: 14, fontWeight: 700, margin: "4px 0 0" }}>{s.system_name}</h4>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{s.model}</div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 18, fontWeight: 800, fontFamily: "var(--font-mono)", color: s.current_power_kw > 0 ? "#22c55e" : "var(--text-muted)" }}>
                    {s.current_power_kw.toFixed(1)} <span style={{ fontSize: 11, color: "var(--text-muted)" }}>kW</span>
                  </div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Rated: {s.rated_power_kw} kW</div>
                </div>
              </div>

              {/* Specs Breakdown */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
                padding: "10px 12px",
                background: "rgba(255,255,255,0.02)",
                borderRadius: 6,
                border: "1px solid var(--border)"
              }}>
                <div>
                  <div style={{ fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase" }}>Generation Today</div>
                  <div style={{ fontSize: 12, fontWeight: 700, fontFamily: "var(--font-mono)", marginTop: 2 }}>
                    {s.energy_today_kwh.toFixed(1)} kWh
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase" }}>Availability</div>
                  <div style={{ fontSize: 12, fontWeight: 700, fontFamily: "var(--font-mono)", color: "#06b6d4", marginTop: 2 }}>
                    {s.availability_pct.toFixed(1)}%
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase" }}>Health Rating</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: s.health_status === "GOOD" ? "#22c55e" : "#ef4444", marginTop: 2 }}>
                    {s.health_status}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase" }}>Active Alerts</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: s.active_alerts_count > 0 ? "#ef4444" : "var(--text-muted)", marginTop: 2 }}>
                    {s.active_alerts_count} Active
                  </div>
                </div>
              </div>

              {/* Location & Action */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border)", paddingTop: 10 }}>
                <span style={{ fontSize: 11, color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 200 }}>
                  📍 {s.location}
                </span>
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--accent, #007bff)", display: "inline-flex", alignItems: "center", gap: 4 }}>
                  Inspect Telemetry <ArrowUpRight size={13} />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedSystem && (
        <EnergySystemDetailModal
          system={selectedSystem}
          onClose={() => setSelectedSystem(null)}
          onRefreshParent={loadSystems}
        />
      )}
    </div>
  );
}

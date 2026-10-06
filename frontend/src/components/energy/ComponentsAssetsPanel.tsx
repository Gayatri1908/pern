"use client";
import React, { useState, useEffect } from "react";
import {
  Cpu, Filter, Search, RefreshCw, CheckCircle2,
  AlertTriangle, Wrench, ShieldCheck
} from "lucide-react";
import { api } from "@/lib/api";
import type { SystemComponent } from "@/types";

export function ComponentsAssetsPanel() {
  const [components, setComponents] = useState<SystemComponent[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [search, setSearch] = useState<string>("");

  const loadComponents = async () => {
    try {
      const params: Record<string, string> = {};
      if (typeFilter !== "ALL") params.component_type = typeFilter;
      if (statusFilter !== "ALL") params.status = statusFilter;

      const res = await api.components.list(params);
      if (res && res.data) {
        setComponents(res.data);
      }
    } catch (err) {
      console.error("Failed to load components:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComponents();
  }, [typeFilter, statusFilter]);

  const filteredComponents = components.filter(c => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.component_name.toLowerCase().includes(q) ||
      c.serial_number.toLowerCase().includes(q) ||
      c.system_id.toLowerCase().includes(q) ||
      c.component_type.toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Top Filter and Search Bar */}
      <div className="source-card" style={{ padding: 16 }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 260 }}>
            <div style={{ position: "relative", width: "100%" }}>
              <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input
                className="source-input"
                type="text"
                placeholder="Search components by Name, Serial Number, or System..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ paddingLeft: 34 }}
              />
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <select
              className="source-input"
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              style={{ padding: "6px 10px", fontSize: 12, width: 170 }}
            >
              <option value="ALL">All Hardware Types</option>
              <option value="Generator">Generator</option>
              <option value="Power Electronics">Power Electronics</option>
              <option value="Mechanical">Mechanical (Tether/Winch)</option>
              <option value="Control System">Control System (Avionics)</option>
              <option value="Sensors">Sensors (Pitot/Anemometer)</option>
              <option value="Energy Storage">Energy Storage (Buffer)</option>
              <option value="Communication">Communication (Gateway)</option>
            </select>

            <select
              className="source-input"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{ padding: "6px 10px", fontSize: 12, width: 140 }}
            >
              <option value="ALL">All Statuses</option>
              <option value="ONLINE">ONLINE</option>
              <option value="WARNING">WARNING</option>
              <option value="FAULT">FAULT</option>
              <option value="OFFLINE">OFFLINE</option>
            </select>
          </div>
        </div>
      </div>

      {/* Components Table */}
      <div className="source-card" style={{ padding: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>
            Industrial Asset Register ({filteredComponents.length} Components)
          </h3>
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
            Traceable Hardware Components
          </span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="source-table" style={{ width: "100%", fontSize: 12 }}>
            <thead>
              <tr>
                <th>Component ID</th>
                <th>Hardware Name</th>
                <th>Subsystem Type</th>
                <th>System ID</th>
                <th>Serial Number</th>
                <th>Health Score</th>
                <th>Status</th>
                <th>Duty Hours</th>
                <th>Next Service</th>
              </tr>
            </thead>
            <tbody>
              {filteredComponents.map(c => (
                <tr key={c.id}>
                  <td style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--accent, #007bff)", fontSize: 11 }}>
                    {c.id}
                  </td>
                  <td style={{ fontWeight: 600 }}>{c.component_name}</td>
                  <td style={{ color: "var(--text-secondary)" }}>{c.component_type}</td>
                  <td style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{c.system_id}</td>
                  <td style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>{c.serial_number}</td>
                  <td>
                    <span style={{
                      fontWeight: 800,
                      fontFamily: "var(--font-mono)",
                      color: c.health_score > 80 ? "#22c55e" : (c.health_score > 60 ? "#f59e0b" : "#ef4444")
                    }}>
                      {c.health_score}%
                    </span>
                  </td>
                  <td>
                    <span style={{
                      padding: "2px 6px",
                      borderRadius: 4,
                      fontSize: 10,
                      fontWeight: 700,
                      background: c.status === "ONLINE" ? "rgba(34,197,94,0.15)" : (c.status === "FAULT" ? "rgba(239,68,68,0.15)" : "rgba(245,158,11,0.15)"),
                      color: c.status === "ONLINE" ? "#22c55e" : (c.status === "FAULT" ? "#ef4444" : "#f59e0b")
                    }}>
                      {c.status}
                    </span>
                  </td>
                  <td style={{ fontFamily: "var(--font-mono)" }}>{c.operating_hours.toFixed(1)} hrs</td>
                  <td style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)" }}>
                    {c.next_maintenance_date || "Nominal"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

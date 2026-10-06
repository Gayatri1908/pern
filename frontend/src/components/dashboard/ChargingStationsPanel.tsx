"use client";
import React, { useState, useEffect } from "react";
import { 
  Battery, MapPin, Compass, Search, Filter, AlertTriangle, 
  CheckCircle, Plus, Info, RefreshCw, Eye, Star, ShieldAlert 
} from "lucide-react";
import { api } from "@/lib/api";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface ChargingStationsPanelProps {
  role?: string | null;
  onOpenCreate?: () => void;
}

export function ChargingStationsPanel({ role, onOpenCreate }: ChargingStationsPanelProps) {
  const [stations, setStations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [distanceFilter, setDistanceFilter] = useState("all");
  const [healthFilter, setHealthFilter] = useState("all");
  const [minAvailable, setMinAvailable] = useState("any");
  const [fastOnly, setFastOnly] = useState(false);
  const [openOnly, setOpenOnly] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // In-app Notifications state
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    loadStations();
  }, []);

  const loadStations = async () => {
    try {
      setLoading(true);
      const data = (await api.products.list()) as any;
      // Filter products that represent EV Charging Stations/Nodes
      const evStations = data.filter((p: any) => 
        p.category === "ev_charging_hub" || 
        p.category === "battery_storage_station" ||
        p.station_name !== null
      );
      setStations(evStations);

      // Generate live alerts/notifications based on database rules
      const activeNotifications: any[] = [];
      evStations.forEach((s: any) => {
        if (s.status === "offline") {
          activeNotifications.push({
            id: `offline-${s.id}`,
            severity: "error",
            message: `Charging Station "${s.station_name || s.product_code}" went offline! Immediate response recommended.`,
            time: "Just now"
          });
        }
        if (s.battery_health < 30) {
          activeNotifications.push({
            id: `health-${s.id}`,
            severity: "warning",
            message: `CRITICAL: Battery Health for "${s.station_name || s.product_code}" fell below 30% (${s.battery_health}%). Maintenance required!`,
            time: "10m ago"
          });
        }
        if (s.status === "maintenance") {
          activeNotifications.push({
            id: `maint-${s.id}`,
            severity: "info",
            message: `Scheduled maintenance active for "${s.station_name || s.product_code}". Ports temporarily unavailable.`,
            time: "1h ago"
          });
        }
      });
      setNotifications(activeNotifications);
    } catch (err) {
      setError("Failed to fetch EV charging stations.");
    } finally {
      setLoading(false);
    }
  };

  // Filter Logic
  const filteredStations = stations.filter(s => {
    if (search) {
      const q = search.toLowerCase();
      const nameMatch = s.station_name && s.station_name.toLowerCase().includes(q);
      const addressMatch = s.station_address && s.station_address.toLowerCase().includes(q);
      const codeMatch = s.product_code.toLowerCase().includes(q);
      if (!nameMatch && !addressMatch && !codeMatch) return false;
    }

    if (healthFilter !== "all") {
      const h = parseFloat(healthFilter);
      if (s.battery_health < h) return false;
    }

    if (minAvailable !== "any") {
      const min = parseInt(minAvailable);
      if (s.available_ports < min) return false;
    }

    if (fastOnly) {
      const isFast = s.charger_type && (s.charger_type.includes("Fast") || s.charger_type.includes("350kW") || s.charger_type.includes("250kW") || s.charger_type.includes("150kW"));
      if (!isFast) return false;
    }

    if (openOnly) {
      if (s.status !== "online") return false;
    }

    return true;
  });

  return (
    <div className="animate-slide-up" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 20, letterSpacing: "0.02em", textTransform: "uppercase" }}>
            Battery Location & Charging Network
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
            Monitor power reserves, charger metrics, and network utilization in real-time.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {role === "Admin" && onOpenCreate && (
            <button className="btn btn-primary" onClick={onOpenCreate}>
              <Plus size={14} style={{ marginRight: 4 }} /> Add Battery Location
            </button>
          )}
          <button className="btn btn-ghost" onClick={loadStations}>
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} style={{ marginRight: 6 }} /> Refresh Network
          </button>
        </div>
      </div>

      {/* Notifications banner */}
      {notifications.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {notifications.map(n => (
            <div 
              key={n.id} 
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 16px",
                borderRadius: "var(--radius-sm)",
                background: n.severity === "error" ? "rgba(239, 68, 68, 0.1)" : n.severity === "warning" ? "rgba(245, 158, 11, 0.1)" : "rgba(59, 130, 246, 0.1)",
                border: `1px solid ${n.severity === "error" ? "rgba(239, 68, 68, 0.2)" : n.severity === "warning" ? "rgba(245, 158, 11, 0.2)" : "rgba(59, 130, 246, 0.2)"}`,
                color: n.severity === "error" ? "var(--error)" : n.severity === "warning" ? "var(--warning)" : "var(--blue)",
                fontSize: 12.5
              }}
            >
              <ShieldAlert size={16} />
              <div style={{ flex: 1 }}>{n.message}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{n.time}</div>
            </div>
          ))}
        </div>
      )}

      {/* Grid Filter and Controls */}
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 12,
        alignItems: "center",
        background: "var(--bg-soft)",
        padding: 16,
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--border)"
      }}>
        <div style={{ position: "relative", minWidth: "240px", flex: 1 }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input
            className="source-input"
            style={{ paddingLeft: 32 }}
            placeholder="Search by city, address or station ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Health filter */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Battery Health:</span>
          <select 
            className="source-input" 
            style={{ padding: "4px 8px", fontSize: 12 }}
            value={healthFilter}
            onChange={e => setHealthFilter(e.target.value)}
          >
            <option value="all">All Health</option>
            <option value="90">&gt; 90% Health</option>
            <option value="80">&gt; 80% Health</option>
            <option value="60">&gt; 60% Health</option>
          </select>
        </div>

        {/* Available ports filter */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Available:</span>
          <select 
            className="source-input" 
            style={{ padding: "4px 8px", fontSize: 12 }}
            value={minAvailable}
            onChange={e => setMinAvailable(e.target.value)}
          >
            <option value="any">Any Availability</option>
            <option value="1">&gt; 1 Ports</option>
            <option value="3">&gt; 3 Ports</option>
            <option value="5">&gt; 5 Ports</option>
          </select>
        </div>

        {/* Fast Charging Switch */}
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, cursor: "pointer", userSelect: "none" }}>
          <input 
            type="checkbox" 
            checked={fastOnly} 
            onChange={e => setFastOnly(e.target.checked)} 
            style={{ accentColor: "var(--blue)" }}
          />
          <span>Fast Charging Only</span>
        </label>

        {/* Open/Online Switch */}
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, cursor: "pointer", userSelect: "none" }}>
          <input 
            type="checkbox" 
            checked={openOnly} 
            onChange={e => setOpenOnly(e.target.checked)} 
            style={{ accentColor: "var(--blue)" }}
          />
          <span>Open Now</span>
        </label>
      </div>

      {/* Charging Station Cards Grid */}
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="source-card" style={{ height: 260, background: "rgba(255,255,255,0.02)", animation: "pulse-dot 1.4s ease infinite" }} />
          ))}
        </div>
      ) : filteredStations.length === 0 ? (
        <div className="source-card" style={{ textAlign: "center", padding: "60px 24px" }}>
          <Battery size={36} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
          <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>No Registered Battery Devices</h4>
          <p style={{ color: "var(--text-muted)", fontSize: 13, maxWidth: 440, margin: "0 auto 16px" }}>
            {role === "Customer" 
              ? "You do not have any registered energy assets or battery locations associated with your account yet." 
              : "No charging stations match your active filters."}
          </p>
          {role === "Customer" && (
            <a href="#catalog" className="btn btn-primary btn-sm" style={{ display: "inline-flex", textDecoration: "none" }}>
              Browse Product Catalog
            </a>
          )}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
          {filteredStations.map(station => (
            <div key={station.id} className="source-card hover-glow" style={{ display: "flex", flexDirection: "column", gap: 14, padding: 18 }}>
              
              {/* Card Title Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 700, margin: 0, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {station.station_name || "EcoVolt Node"}
                  </h4>
                  <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                    {station.product_code}
                  </span>
                </div>
                <StatusBadge status={station.status} />
              </div>

              {/* Address */}
              <div style={{ display: "flex", gap: 6, fontSize: 12, color: "var(--text-muted)", marginTop: -4 }}>
                <MapPin size={13} style={{ flexShrink: 0, color: "var(--blue)" }} />
                <span>{station.station_address || "Pune, Maharashtra"}</span>
              </div>

              {/* Station metrics */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
                background: "rgba(255,255,255,0.02)",
                padding: 12,
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border)",
                fontSize: 12
              }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ color: "var(--text-muted)" }}>Battery Health</span>
                  <span style={{ fontWeight: 700, color: station.battery_health > 80 ? "var(--green)" : station.battery_health > 50 ? "var(--warning)" : "var(--error)" }}>
                    {station.battery_health}%
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ color: "var(--text-muted)" }}>Battery Available</span>
                  <span style={{ fontWeight: 700, color: "var(--text)" }}>
                    {station.current_charge_pct}%
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ color: "var(--text-muted)" }}>Charging Ports</span>
                  <span style={{ fontWeight: 700, color: "var(--text)" }}>
                    {station.available_ports} / {station.total_ports} Avail
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ color: "var(--text-muted)" }}>Storage Capacity</span>
                  <span style={{ fontWeight: 700, color: "var(--text)" }}>
                    {station.battery_capacity_kwh} kWh
                  </span>
                </div>
              </div>

              {/* Details and Type */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "baseline" }}>
                  <span style={{ color: "var(--text-muted)", flexShrink: 0 }}>Charger Type:</span>
                  <span style={{ fontWeight: 600, textAlign: "right", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {station.charger_type || "Fast DC (150kW)"}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "baseline" }}>
                  <span style={{ color: "var(--text-muted)", flexShrink: 0 }}>Est. Charge Time:</span>
                  <span style={{ fontWeight: 600 }}>~{station.status === "online" ? "24 mins" : "N/A"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "baseline" }}>
                  <span style={{ color: "var(--text-muted)", flexShrink: 0 }}>Last Updated:</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>
                    {station.updated_at ? new Date(station.updated_at).toLocaleTimeString() : "Just now"}
                  </span>
                </div>
              </div>

              {/* Map/Navigation Action */}
              <div style={{ display: "flex", gap: 8, marginTop: "auto", paddingTop: 4 }}>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${station.install_lat || 18.5204},${station.install_lng || 73.8567}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm btn-ghost w-full"
                  style={{ justifyContent: "center", textDecoration: "none" }}
                >
                  <Compass size={12} style={{ marginRight: 6 }} /> Google Maps Directions
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

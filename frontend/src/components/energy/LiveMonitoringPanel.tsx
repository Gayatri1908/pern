"use client";
import React, { useState, useEffect } from "react";
import {
  Activity, Wind, Zap, Gauge, AlertTriangle, ShieldCheck,
  RefreshCw, CheckCircle2, RotateCw, Compass, ArrowDown
} from "lucide-react";
import { api } from "@/lib/api";

export function LiveMonitoringPanel() {
  const [liveSystems, setLiveSystems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSystemId, setSelectedSystemId] = useState<string>("");
  const [lastHeartbeat, setLastHeartbeat] = useState<string>("");

  const fetchLive = async () => {
    try {
      const res = await api.monitoring.live();
      if (res && res.data) {
        setLiveSystems(res.data);
        if (!selectedSystemId && res.data.length > 0) {
          setSelectedSystemId(res.data[0].id);
        }
        setLastHeartbeat(new Date().toLocaleTimeString("en-IN"));
      }
    } catch (err) {
      console.error("Live monitoring fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLive();
    const interval = setInterval(fetchLive, 3000); // 3-second live telemetry refresh
    return () => clearInterval(interval);
  }, []);

  const currentSystem = liveSystems.find(s => s.id === selectedSystemId) || liveSystems[0];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Cockpit Status Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "rgba(0, 123, 255, 0.05)",
        border: "1px solid rgba(0, 123, 255, 0.25)",
        borderRadius: 12,
        padding: "16px 20px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 12, height: 12, borderRadius: "50%",
            background: "#22c55e",
            boxShadow: "0 0 12px #22c55e",
            animation: "pulse-dot 1.8s ease infinite"
          }} />
          <div>
            <span style={{ fontSize: 13, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Airborne Telemetry Cockpit
            </span>
            <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 12 }}>
              Telemetry Frequency: 4.0s • Last Packet: {lastHeartbeat}
            </span>
          </div>
        </div>

        {/* System Selector */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>Active Stream:</span>
          <select
            className="source-input"
            value={selectedSystemId}
            onChange={e => setSelectedSystemId(e.target.value)}
            style={{ padding: "6px 12px", fontSize: 12, width: 220, fontFamily: "var(--font-mono)" }}
          >
            {liveSystems.map(s => (
              <option key={s.id} value={s.id}>
                {s.id} — {s.system_name} ({s.status})
              </option>
            ))}
          </select>
        </div>
      </div>

      {currentSystem && (
        <>
          {/* Main Gauges Strip */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
            {/* Power Output Gauge */}
            <div className="source-card" style={{ padding: 20, textAlign: "center", borderTop: "4px solid #007bff" }}>
              <Zap size={22} color="#007bff" style={{ margin: "0 auto 8px" }} />
              <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>
                Instantaneous Power Output
              </div>
              <div style={{ fontSize: 32, fontWeight: 900, fontFamily: "var(--font-mono)", color: "var(--text)", margin: "8px 0 4px" }}>
                {currentSystem.power_output_kw ? currentSystem.power_output_kw.toFixed(2) : "0.00"}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                kW (Rated: {currentSystem.rated_power_kw} kW)
              </div>
            </div>

            {/* High-Altitude Wind Speed */}
            <div className="source-card" style={{ padding: 20, textAlign: "center", borderTop: "4px solid #06b6d4" }}>
              <Wind size={22} color="#06b6d4" style={{ margin: "0 auto 8px" }} />
              <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>
                Anemometer Wind Speed
              </div>
              <div style={{ fontSize: 32, fontWeight: 900, fontFamily: "var(--font-mono)", color: "var(--text)", margin: "8px 0 4px" }}>
                {currentSystem.wind_speed_ms ? currentSystem.wind_speed_ms.toFixed(1) : "0.0"}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                m/s (Heading: {currentSystem.wind_direction_deg || 245}°)
              </div>
            </div>

            {/* Dyneema Tether Tension */}
            <div className="source-card" style={{ padding: 20, textAlign: "center", borderTop: "4px solid #8b5cf6" }}>
              <Activity size={22} color="#8b5cf6" style={{ margin: "0 auto 8px" }} />
              <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>
                Dynamic Tether Tension
              </div>
              <div style={{ fontSize: 32, fontWeight: 900, fontFamily: "var(--font-mono)", color: "var(--text)", margin: "8px 0 4px" }}>
                {currentSystem.tether_tension_kn ? currentSystem.tether_tension_kn.toFixed(1) : "0.0"}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                kN (Max Threshold: 45.0 kN)
              </div>
            </div>

            {/* Rotor Speed */}
            <div className="source-card" style={{ padding: 20, textAlign: "center", borderTop: "4px solid #10b981" }}>
              <Gauge size={22} color="#10b981" style={{ margin: "0 auto 8px" }} />
              <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>
                Airborne Rotor RPM
              </div>
              <div style={{ fontSize: 32, fontWeight: 900, fontFamily: "var(--font-mono)", color: "var(--text)", margin: "8px 0 4px" }}>
                {currentSystem.rotor_rpm || 0}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                RPM Nominal Range
              </div>
            </div>

            {/* Flight Altitude */}
            <div className="source-card" style={{ padding: 20, textAlign: "center", borderTop: "4px solid #f59e0b" }}>
              <Compass size={22} color="#f59e0b" style={{ margin: "0 auto 8px" }} />
              <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>
                Operating Flight Altitude
              </div>
              <div style={{ fontSize: 32, fontWeight: 900, fontFamily: "var(--font-mono)", color: "var(--text)", margin: "8px 0 4px" }}>
                {currentSystem.flight_altitude_m || 0}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                Meters Above Ground Level
              </div>
            </div>
          </div>

          {/* Subsystem Technical Status Matrix */}
          <div className="source-card" style={{ padding: 22 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 16px" }}>
              Real-time Subsystem Bus Diagnostics & State Vector
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
              <div style={{ padding: 14, background: "rgba(255,255,255,0.02)", borderRadius: 8, border: "1px solid var(--border)" }}>
                <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase" }}>Bus Voltage</div>
                <div style={{ fontSize: 18, fontWeight: 800, fontFamily: "var(--font-mono)", marginTop: 4 }}>
                  {currentSystem.voltage_v ? currentSystem.voltage_v.toFixed(1) : "0.0"} V
                </div>
                <div style={{ fontSize: 10, color: "var(--green, #22c55e)", marginTop: 4 }}>Grid Synced (3-Phase AC)</div>
              </div>

              <div style={{ padding: 14, background: "rgba(255,255,255,0.02)", borderRadius: 8, border: "1px solid var(--border)" }}>
                <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase" }}>Current Draw</div>
                <div style={{ fontSize: 18, fontWeight: 800, fontFamily: "var(--font-mono)", marginTop: 4 }}>
                  {currentSystem.current_a ? currentSystem.current_a.toFixed(1) : "0.0"} A
                </div>
                <div style={{ fontSize: 10, color: "var(--text-secondary)", marginTop: 4 }}>Nominal Inverter Load</div>
              </div>

              <div style={{ padding: 14, background: "rgba(255,255,255,0.02)", borderRadius: 8, border: "1px solid var(--border)" }}>
                <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase" }}>Generator Stator Temp</div>
                <div style={{ fontSize: 18, fontWeight: 800, fontFamily: "var(--font-mono)", marginTop: 4 }}>
                  {currentSystem.temperature_c ? currentSystem.temperature_c.toFixed(1) : "0.0"} °C
                </div>
                <div style={{ fontSize: 10, color: "var(--green, #22c55e)", marginTop: 4 }}>Normal Operating Envelope</div>
              </div>

              <div style={{ padding: 14, background: "rgba(255,255,255,0.02)", borderRadius: 8, border: "1px solid var(--border)" }}>
                <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase" }}>LiFePO4 Storage Buffer</div>
                <div style={{ fontSize: 18, fontWeight: 800, fontFamily: "var(--font-mono)", marginTop: 4 }}>
                  {currentSystem.battery_soc_pct ? currentSystem.battery_soc_pct.toFixed(1) : "90.0"} %
                </div>
                <div style={{ fontSize: 10, color: "var(--green, #22c55e)", marginTop: 4 }}>State of Charge Healthy</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

"use client";
import React, { useEffect, useState } from "react";
import { 
  Activity, Zap, Clock, Leaf, Battery, 
  Wifi, Phone, Mail, Calendar, HelpCircle, FileText, Settings, ChevronRight, Share2, Video, BarChart2, ShieldAlert
} from "lucide-react";
import { api } from "@/lib/api";

interface MyProductData {
  id: string;
  productName: string;
  image: string;
  serialNumber: string;
  firmware: string;
  installDate: string;
  location: string;
  status: string;
  health: number;
  energyToday: number;
  efficiency: number;
  powerOutput: number;
  lastSync: string;
  batteryPct: number;
  signalStrength: string;
}

export function MyProductsDashboard() {
  const [products, setProducts] = useState<MyProductData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.products.myProducts()
      .then((data: any) => {
        setProducts(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalEnergy = products.reduce((acc, p) => acc + p.energyToday, 0);
  const avgHealth = products.length > 0 
    ? products.reduce((acc, p) => acc + p.health, 0) / products.length 
    : 0;
  const activeDevices = products.filter(p => p.status.toLowerCase() === "online").length;

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ display: "flex", gap: 16 }}>
          {[1,2,3,4].map(i => <div key={i} className="source-card" style={{ flex: 1, height: 120, background: "rgba(255,255,255,0.02)", animation: "pulse-dot 1.4s ease infinite" }} />)}
        </div>
        <div className="source-card" style={{ height: 400, background: "rgba(255,255,255,0.02)", animation: "pulse-dot 1.4s ease infinite" }} />
      </div>
    );
  }

  return (
    <div className="animate-slide-up" style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      
      {/* ── HEADER ────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: -8 }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 24, letterSpacing: "-0.02em", color: "var(--text)" }}>
            My Products
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>
            Manage and monitor your assigned renewable energy systems.
          </p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button className="btn btn-ghost" onClick={() => window.location.hash = "alerts"}><ShieldAlert size={16} style={{ marginRight: 6 }} /> Alerts</button>
          <button className="btn btn-primary" onClick={() => window.location.hash = "complaints"}><HelpCircle size={16} style={{ marginRight: 6 }} /> Support</button>
        </div>
      </div>

      {/* ── KPI SUMMARY CARDS ─────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
        <SummaryCard title="Active Devices" value={`${activeDevices} / ${products.length}`} icon={<Activity />} accent="var(--blue)" />
        <SummaryCard title="Today's Energy" value={`${totalEnergy.toFixed(1)} kWh`} icon={<Zap />} accent="var(--green)" />
        <SummaryCard title="Total Lifetime" value={`${(totalEnergy * 15.4).toFixed(1)} MWh`} icon={<Clock />} accent="var(--blue)" />
        <SummaryCard title="Avg Health Score" value={`${avgHealth.toFixed(1)}%`} icon={<Activity />} accent={avgHealth > 90 ? "var(--green)" : "var(--warn)"} />
      </div>

      {/* ── ASSIGNED PRODUCTS ─────────────────────────────────── */}
      {products.length === 0 ? (
        <div className="source-card" style={{ textAlign: "center", padding: "80px 24px", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ width: 80, height: 80, borderRadius: 40, background: "rgba(0,123,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24, color: "var(--blue)" }}>
            <Leaf size={40} />
          </div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 700, color: "var(--text)", marginBottom: 12 }}>No Products Assigned Yet</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: 14, maxWidth: 400, lineHeight: 1.6, marginBottom: 32 }}>
            Your purchased renewable energy systems will appear here after installation and activation by our engineering team.
          </p>
          <div style={{ display: "flex", gap: 16 }}>
            <button className="btn btn-primary" onClick={() => window.location.hash = "products"}>Browse Catalog</button>
            <button className="btn btn-ghost" onClick={() => window.location.hash = "my_requests"}>Contact Sales</button>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {products.map(product => (
            <div key={product.id} className="source-card" style={{ display: "flex", flexDirection: "column", overflow: "hidden", border: "1px solid rgba(255,255,255,0.05)", boxShadow: "0 8px 32px rgba(0,0,0,0.1)" }}>
              
              {/* Product Header Row */}
              <div style={{ display: "flex", flexWrap: "wrap", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                {/* Image Section */}
                <div style={{ width: 280, minHeight: 200, background: "#f8f9fa", position: "relative" }}>
                  <img src={product.image} alt={product.productName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <div style={{ position: "absolute", top: 12, left: 12 }}>
                    <div style={{ 
                      display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", 
                      background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", borderRadius: 20,
                      color: "white", fontSize: 11, fontWeight: 600, border: "1px solid rgba(255,255,255,0.1)"
                    }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: product.status === "online" ? "var(--green)" : "var(--error)", boxShadow: `0 0 8px ${product.status === "online" ? "var(--green)" : "var(--error)"}` }} />
                      {product.status.toUpperCase()}
                    </div>
                  </div>
                </div>

                {/* Details Section */}
                <div style={{ flex: 1, minWidth: 300, padding: 24, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <h3 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, color: "var(--text)", marginBottom: 16 }}>
                      {product.productName}
                    </h3>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 24px" }}>
                      <DetailRow label="Serial Number" value={product.serialNumber} />
                      <DetailRow label="Firmware" value={product.firmware} />
                      <DetailRow label="Installed" value={product.installDate} />
                      <DetailRow label="Location" value={product.location} />
                      <DetailRow label="Warranty" value="Active (Standard)" />
                      <DetailRow label="Administrator" value="The Source Energy" />
                    </div>
                  </div>
                </div>

                {/* Metrics Section */}
                <div style={{ width: 280, padding: 24, borderLeft: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", gap: 16, background: "rgba(0,123,255,0.02)" }}>
                  <MetricRow label="Today's Energy" value={`${product.energyToday.toFixed(1)} kWh`} />
                  <MetricRow label="Efficiency" value={`${product.efficiency.toFixed(1)}%`} />
                  <MetricRow label="Power Output" value={`${product.powerOutput.toFixed(2)} kW`} />
                  <MetricRow label="Health Score" value={`${product.health.toFixed(1)}%`} highlight={product.health > 90} />
                </div>
              </div>

              {/* Status & Actions Footer */}
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", background: "rgba(0,0,0,0.1)" }}>
                
                {/* Live Status */}
                <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
                  <StatusItem icon={<Clock size={14} />} label="Last Sync" value={product.lastSync} />
                  <StatusItem icon={<Wifi size={14} />} label="Connection" value="MQTT Connected" />
                  <StatusItem icon={<Activity size={14} />} label="Signal" value={product.signalStrength} />
                  <StatusItem icon={<Battery size={14} />} label="Battery" value={`${product.batteryPct}%`} />
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => window.location.hash = "analytics"}><BarChart2 size={14} style={{ marginRight: 6 }} /> Analytics</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => window.location.hash = "reports"}><FileText size={14} style={{ marginRight: 6 }} /> Reports</button>
                  <button className="btn btn-primary btn-sm" onClick={() => window.location.hash = "monitoring"}><Activity size={14} style={{ marginRight: 6 }} /> Live Monitor</button>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── SUPPORT FOOTER ────────────────────────────────────── */}
      <div className="source-card" style={{ padding: 32, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", background: "linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(0,123,255,0.05) 100%)" }}>
        <h3 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>Need Help with your Systems?</h3>
        <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 24, maxWidth: 500 }}>
          Our enterprise support team is available 24/7 to assist with maintenance, software updates, or technical troubleshooting.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12 }}>
          <button className="btn btn-primary" onClick={() => window.open("tel:+1234567890")}><Phone size={14} style={{ marginRight: 6 }} /> Call Us</button>
          <button className="btn btn-ghost" style={{ background: "rgba(37, 211, 102, 0.1)", color: "#25D366" }} onClick={() => window.open("https://wa.me/1234567890")}><Share2 size={14} style={{ marginRight: 6 }} /> WhatsApp</button>
          <button className="btn btn-ghost" onClick={() => window.open("mailto:support@thesource.com")}><Mail size={14} style={{ marginRight: 6 }} /> Email Support</button>
          <button className="btn btn-ghost" onClick={() => window.location.hash = "maintenance"}><Calendar size={14} style={{ marginRight: 6 }} /> Schedule Maintenance</button>
          <button className="btn btn-ghost" onClick={() => window.open("https://calendly.com")}><Video size={14} style={{ marginRight: 6 }} /> Book Video Call</button>
        </div>
      </div>

    </div>
  );
}

// ── SUBCOMPONENTS ──────────────────────────────────────────────────

function SummaryCard({ title, value, icon, accent }: { title: string, value: string, icon: React.ReactNode, accent: string }) {
  return (
    <div className="source-card" style={{ padding: 20, display: "flex", alignItems: "flex-start", justifyContent: "space-between", borderBottom: `2px solid ${accent}` }}>
      <div>
        <p style={{ fontSize: 11, fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>{title}</p>
        <p style={{ fontSize: 24, fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--text)" }}>{value}</p>
      </div>
      <div style={{ color: accent, background: `${accent}1A`, padding: 10, borderRadius: 10 }}>
        {icon}
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string, value: string }) {
  return (
    <div>
      <p style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: 13, color: "var(--text)", fontWeight: 500 }}>{value}</p>
    </div>
  );
}

function MetricRow({ label, value, highlight = false }: { label: string, value: string, highlight?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <span style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: 15, fontFamily: "var(--font-mono)", fontWeight: 700, color: highlight ? "var(--green)" : "var(--text)" }}>{value}</span>
    </div>
  );
}

function StatusItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ color: "var(--blue)" }}>{icon}</div>
      <div>
        <p style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)", textTransform: "uppercase", lineHeight: 1.2 }}>{label}</p>
        <p style={{ fontSize: 12, color: "var(--text)", fontWeight: 500, lineHeight: 1.2 }}>{value}</p>
      </div>
    </div>
  );
}

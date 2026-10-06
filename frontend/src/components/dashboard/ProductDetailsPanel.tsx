import React from "react";
import { ArrowLeft, CheckCircle, Zap, Shield, Cloud, Activity, Settings, Wind } from "lucide-react";

interface Props {
  product: any;
  onBack: () => void;
  onRequest: (type: "registration" | "consultation" | "sales") => void;
}

export function ProductDetailsPanel({ product, onBack, onRequest }: Props) {
  const defaultFeatures = [
    { icon: "Zap", title: "AI Energy Optimization", desc: "Maximizes output by adapting to wind patterns in real-time." },
    { icon: "Activity", title: "Live IoT Monitoring", desc: "Track performance from anywhere via the cloud." },
    { icon: "Settings", title: "Predictive Maintenance", desc: "Sensors detect wear before failure occurs." },
    { icon: "Cloud", title: "Cloud Analytics", desc: "Deep insights and reporting on energy yields." },
    { icon: "Wind", title: "Weather Intelligence", desc: "Automatic retraction during extreme storm events." },
    { icon: "Shield", title: "Low Noise Operation", desc: "Silent generation perfect for urban environments." },
  ];

  const featuresToUse = product.features || defaultFeatures;

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case "Zap": return <Zap size={20} />;
      case "Activity": return <Activity size={20} />;
      case "Settings": return <Settings size={20} />;
      case "Cloud": return <Cloud size={20} />;
      case "Wind": return <Wind size={20} />;
      case "Shield": return <Shield size={20} />;
      default: return <Zap size={20} />;
    }
  };

  return (
    <div className="animate-slide-up" style={{ paddingBottom: 60 }}>
      {/* Back Button */}
      <button className="btn btn-ghost" onClick={onBack} style={{ marginBottom: 24, paddingLeft: 0 }}>
        <ArrowLeft size={16} style={{ marginRight: 8 }} /> Back to Catalog
      </button>

      {/* Hero Section */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 40, marginBottom: 60 }}>
        <div style={{ flex: "1 1 400px" }}>
          <img 
            src={product.image} 
            alt={product.name} 
            style={{ width: "100%", height: 400, objectFit: "cover", borderRadius: 16, boxShadow: "0 12px 24px rgba(0,0,0,0.1)" }} 
          />
        </div>
        
        <div style={{ flex: "1 1 400px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ display: "inline-block", background: "rgba(0,123,255,0.1)", color: "var(--blue)", padding: "6px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, marginBottom: 16, alignSelf: "flex-start" }}>
            {product.status}
          </div>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 36, letterSpacing: "-0.02em", color: "var(--text)", marginBottom: 12 }}>
            {product.name}
          </h1>
          <p style={{ fontSize: 18, color: "var(--text-secondary)", marginBottom: 32, lineHeight: 1.6 }}>
            {product.tagline}
          </p>
          
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <button className="btn btn-primary" style={{ padding: "12px 24px" }} onClick={() => onRequest("registration")}>
              Request Registration
            </button>
            <button className="btn btn-ghost" style={{ padding: "12px 24px" }} onClick={() => onRequest("consultation")}>
              Book Consultation
            </button>
            <button className="btn btn-ghost" style={{ padding: "12px 24px" }} onClick={() => onRequest("sales")}>
              Contact Sales
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 40 }}>
        {/* Main Content */}
        <div style={{ flex: "2 1 600px" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 24, marginBottom: 16, color: "var(--text)" }}>Overview</h2>
          <p style={{ color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 40 }}>
            {product.description || `The ${product.name} represents a breakthrough in airborne renewable energy. By accessing higher altitude winds, it generates up to 50% more power than conventional ground-based turbines of similar size. Equipped with a suite of IoT sensors and autonomous flight control, it ensures maximum efficiency while drastically reducing installation and material costs.`}
          </p>

          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 24, marginBottom: 24, color: "var(--text)" }}>Key Features</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 24, marginBottom: 40 }}>
            {featuresToUse.map((f: any, i: number) => (
              <div key={i} className="source-card" style={{ padding: 20 }}>
                <div style={{ color: "var(--blue)", marginBottom: 12 }}>{renderIcon(f.icon)}</div>
                <h4 style={{ fontWeight: 600, marginBottom: 8, color: "var(--text)" }}>{f.title}</h4>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>{f.desc}</p>
              </div>
            ))}
          </div>
          
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 24, marginBottom: 16, color: "var(--text)" }}>Ideal Applications</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            {(product.applications || ["Industrial Plants", "Commercial Buildings", "Agriculture", "Remote Villages", "Telecommunication Towers", "Smart Cities"]).map((app: any) => (
              <div key={app} style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--bg-elevated)", padding: "8px 16px", borderRadius: 20, border: "1px solid var(--border)" }}>
                <CheckCircle size={14} style={{ color: "var(--green)" }} />
                <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>{app}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Technical Specs Sidebar */}
        <div style={{ flex: "1 1 300px" }}>
          <div className="source-card" style={{ padding: 24, background: "rgba(0,0,0,0.02)" }}>
            <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 20, marginBottom: 24, color: "var(--text)", borderBottom: "1px solid var(--border)", paddingBottom: 12 }}>
              Technical Specifications
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {Object.entries(product.specs).map(([key, value]) => (
                <div key={key}>
                  <p style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{key}</p>
                  <p style={{ fontSize: 14, color: "var(--text)", fontWeight: 500 }}>{value as string}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom CTA */}
      {/* Bottom CTA */}
      <div className="source-card" style={{ marginTop: 80, padding: 60, textAlign: "center" }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 32, marginBottom: 16, color: "var(--text)" }}>Ready to Power Your Future?</h2>
        <p style={{ fontSize: 16, maxWidth: 500, margin: "0 auto", marginBottom: 32, color: "var(--text-secondary)" }}>
          Take the first step towards sustainable, intelligent energy generation for your business.
        </p>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          <button className="btn btn-primary" style={{ padding: "12px 32px" }} onClick={() => onRequest("registration")}>
            Request Registration
          </button>
          <button className="btn btn-ghost" style={{ padding: "12px 32px" }} onClick={() => onRequest("sales")}>
            Contact Sales
          </button>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { ArrowRight, Info, Phone, Calendar, Edit, Plus, Trash, Check, X } from "lucide-react";
import { ProductDetailsPanel } from "./ProductDetailsPanel";
import { RequestForms } from "./RequestForms";

// Fallback/Initial catalog data
const INITIAL_PRODUCTS = [
  {
    id: "catalog-1",
    name: "Airborne Wind Turbine X1",
    tagline: "Industrial-grade energy generation from the sky.",
    description: "The Airborne Wind Turbine X1 utilizes advanced tethered drone flight algorithms to capture strong, steady high-altitude wind currents. Designed for heavy industrial energy demands, it offers a reliable microgrid supplement for remote factories and off-grid mining setups.",
    status: "Available",
    highlights: ["12kW Output", "AI Optimized", "Real-Time IoT", "Low Maintenance", "5-Year Warranty"],
    image: "https://images.unsplash.com/photo-1466611653911-95081537e5b7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    features: [
      { "icon": "Zap", "title": "AI Energy Optimization", "desc": "Maximizes output by adapting to wind patterns in real-time." },
      { "icon": "Activity", "title": "Live IoT Monitoring", "desc": "Track performance from anywhere via the cloud." },
      { "icon": "Settings", "title": "Predictive Maintenance", "desc": "Sensors detect wear before failure occurs." },
      { "icon": "Cloud", "title": "Cloud Analytics", "desc": "Deep insights and reporting on energy yields." },
      { "icon": "Wind", "title": "Weather Intelligence", "desc": "Automatic retraction during extreme storm events." },
      { "icon": "Shield", "title": "Low Noise Operation", "desc": "Silent generation perfect for urban environments." }
    ],
    applications: ["Industrial Plants", "Commercial Buildings", "Agriculture", "Remote Villages", "Telecommunication Towers", "Smart Cities"],
    specs: {
      "Power Output": "12kW",
      "Operating Height": "150m - 300m",
      "Wind Speed Range": "3m/s - 25m/s",
      "Rotor Diameter": "4.5m",
      "Expected Lifespan": "15 Years",
      "Warranty": "5 Years Comprehensive",
      "Efficiency": "up to 45% Capacity Factor"
    }
  },
  {
    id: "catalog-2",
    name: "Micro-Tether C3",
    tagline: "Compact, efficient, and perfect for remote installations.",
    description: "The Micro-Tether C3 is a portable wind turbine solution designed for fast deployment. Ideal for research stations, emergency response encampments, and small agricultural setups, it packs down into standard transport cases and can be assembled by a two-person team in under an hour.",
    status: "Limited Stock",
    highlights: ["5kW Output", "Ultra-Portable", "Quick Setup", "Weather Resistant", "Off-Grid Ready"],
    image: "https://images.unsplash.com/photo-1532601224476-15c79f2f7a51?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    features: [
      { "icon": "Zap", "title": "AI Energy Optimization", "desc": "Maximizes output by adapting to wind patterns in real-time." },
      { "icon": "Activity", "title": "Live IoT Monitoring", "desc": "Track performance from anywhere via the cloud." },
      { "icon": "Settings", "title": "Predictive Maintenance", "desc": "Sensors detect wear before failure occurs." },
      { "icon": "Cloud", "title": "Cloud Analytics", "desc": "Deep insights and reporting on energy yields." },
      { "icon": "Wind", "title": "Weather Intelligence", "desc": "Automatic retraction during extreme storm events." },
      { "icon": "Shield", "title": "Low Noise Operation", "desc": "Silent generation perfect for urban environments." }
    ],
    applications: ["Industrial Plants", "Commercial Buildings", "Agriculture", "Remote Villages", "Telecommunication Towers", "Smart Cities"],
    specs: {
      "Power Output": "5kW",
      "Operating Height": "100m - 200m",
      "Wind Speed Range": "2.5m/s - 20m/s",
      "Rotor Diameter": "2.8m",
      "Expected Lifespan": "10 Years",
      "Warranty": "3 Years Standard",
      "Efficiency": "up to 40% Capacity Factor"
    }
  },
  {
    id: "catalog-3",
    name: "Offshore MegaKite V9",
    tagline: "Massive scale renewable generation for offshore platforms.",
    description: "Engineered to withstand extreme marine conditions, the Offshore MegaKite V9 captures high-velocity sea winds to generate megawatt-scale power. It integrates directly with offshore gas rigs, deep-sea exploration vessels, and coastal island grids.",
    status: "Coming Soon",
    highlights: ["100kW Output", "Typhoon Rated", "Grid Scale", "AI Fleet Control", "10-Year Warranty"],
    image: "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    features: [
      { "icon": "Zap", "title": "AI Energy Optimization", "desc": "Maximizes output by adapting to wind patterns in real-time." },
      { "icon": "Activity", "title": "Live IoT Monitoring", "desc": "Track performance from anywhere via the cloud." },
      { "icon": "Settings", "title": "Predictive Maintenance", "desc": "Sensors detect wear before failure occurs." },
      { "icon": "Cloud", "title": "Cloud Analytics", "desc": "Deep insights and reporting on energy yields." },
      { "icon": "Wind", "title": "Weather Intelligence", "desc": "Automatic retraction during extreme storm events." },
      { "icon": "Shield", "title": "Low Noise Operation", "desc": "Silent generation perfect for urban environments." }
    ],
    applications: ["Industrial Plants", "Commercial Buildings", "Agriculture", "Remote Villages", "Telecommunication Towers", "Smart Cities"],
    specs: {
      "Power Output": "100kW",
      "Operating Height": "200m - 500m",
      "Wind Speed Range": "4m/s - 35m/s",
      "Rotor Diameter": "12m",
      "Expected Lifespan": "20 Years",
      "Warranty": "10 Years Extended",
      "Efficiency": "up to 55% Capacity Factor"
    }
  }
];

export function CatalogPanel() {
  const [products, setProducts] = useState<any[]>(INITIAL_PRODUCTS);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showForm, setShowForm] = useState<"registration" | "consultation" | "sales" | null>(null);
  
  // Admin Editing state
  const [isEditingCatalog, setIsEditingCatalog] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [tempHighlights, setTempHighlights] = useState("");
  const [tempSpecs, setTempSpecs] = useState<any[]>([]); // Array of key-value objects
  const [tempApplications, setTempApplications] = useState("");
  const [tempFeatures, setTempFeatures] = useState<any[]>([]);
  const [statusMsg, setStatusMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const role = typeof window !== "undefined" ? localStorage.getItem("role") : null;
  const isAdmin = role === "Admin";

  const fetchCatalog = async () => {
    setLoading(true);
    const token = localStorage.getItem("access_token");
    try {
      const res = await fetch(`http://${window.location.hostname}:8000/api/v1/products/catalog`, {
        headers: {
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setProducts(data);
        }
      }
    } catch (e) {
      console.error("Failed to load dynamic catalog", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  const handleSaveCatalog = async (updatedList: any[], shouldExitEditor = true) => {
    const token = localStorage.getItem("access_token");
    try {
      const res = await fetch(`http://${window.location.hostname}:8000/api/v1/products/catalog`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify(updatedList)
      });
      if (res.ok) {
        setProducts(updatedList);
        setStatusMsg({ type: "ok", text: "Catalog updated successfully!" });
        if (shouldExitEditor) {
          setIsEditingCatalog(false);
          setEditingItem(null);
        }
      } else {
        setStatusMsg({ type: "err", text: "Failed to update catalog on server." });
      }
    } catch (e) {
      setStatusMsg({ type: "err", text: "Error saving catalog." });
    }
  };

  const startEditProduct = (prod: any) => {
    setEditingItem({ ...prod });
    setTempHighlights(prod.highlights.join(", "));
    setTempSpecs(Object.entries(prod.specs || {}).map(([key, value]) => ({ key, value })));
    setTempApplications((prod.applications || []).join(", "));
    setTempFeatures(prod.features || []);
  };

  const handleAddProduct = () => {
    const newProd = {
      id: `catalog-${Date.now()}`,
      name: "New Renewable Product",
      tagline: "Product tagline description.",
      description: "Detailed description of the product.",
      status: "Available",
      highlights: ["Feature 1", "Feature 2"],
      image: "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      features: [
        { "icon": "Zap", "title": "AI Energy Optimization", "desc": "Maximizes output by adapting to wind patterns in real-time." }
      ],
      applications: ["Industrial Plants", "Commercial Buildings"],
      specs: {
        "Power Output": "10kW",
        "Warranty": "5 Years"
      }
    };
    startEditProduct(newProd);
  };

  const saveProductEdit = () => {
    if (!editingItem) return;
    const highlightsArray = tempHighlights.split(",").map(s => s.trim()).filter(Boolean);
    const specsObject: Record<string, string> = {};
    tempSpecs.forEach(item => {
      if (item.key.trim()) {
        specsObject[item.key.trim()] = item.value;
      }
    });

    const updatedProduct = {
      ...editingItem,
      highlights: highlightsArray,
      specs: specsObject,
      applications: tempApplications.split(",").map(s => s.trim()).filter(Boolean),
      features: tempFeatures
    };

    let updatedProducts;
    if (products.some(p => p.id === updatedProduct.id)) {
      updatedProducts = products.map(p => p.id === updatedProduct.id ? updatedProduct : p);
    } else {
      updatedProducts = [...products, updatedProduct];
    }
    handleSaveCatalog(updatedProducts);
  };

  const handleDeleteProduct = (id: string) => {
    if (window.confirm("Are you sure you want to delete this product from the catalog?")) {
      const updated = products.filter(p => p.id !== id);
      handleSaveCatalog(updated, false);
    }
  };

  if (showForm) {
    return <RequestForms 
      formType={showForm} 
      product={selectedProduct} 
      onBack={() => setShowForm(null)} 
    />;
  }

  if (selectedProduct) {
    return <ProductDetailsPanel 
      product={selectedProduct} 
      onBack={() => setSelectedProduct(null)} 
      onRequest={(type: "registration" | "consultation" | "sales") => setShowForm(type)}
    />;
  }

  if (isEditingCatalog) {
    return (
      <div className="animate-slide-up" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, textTransform: "uppercase" }}>Edit Product Catalog</h2>
            <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>Modify public catalog products, highlights, and specifications.</p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => { setIsEditingCatalog(false); setEditingItem(null); }}>
            <X size={14} style={{ marginRight: 6 }} /> Exit Editor
          </button>
        </div>

        {editingItem ? (
          <div className="source-card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, textTransform: "uppercase" }}>
              {products.some(p => p.id === editingItem.id) ? "Modify Product Details" : "Create New Product"}
            </h3>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)", display: "block", marginBottom: 4 }}>Product Name</label>
                <input type="text" className="source-input" style={{ width: "100%" }} value={editingItem.name} onChange={e => setEditingItem({ ...editingItem, name: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)", display: "block", marginBottom: 4 }}>Product Status</label>
                <select className="source-input" style={{ width: "100%" }} value={editingItem.status} onChange={e => setEditingItem({ ...editingItem, status: e.target.value })}>
                  <option value="Available">Available</option>
                  <option value="Limited Stock">Limited Stock</option>
                  <option value="Coming Soon">Coming Soon</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)", display: "block", marginBottom: 4 }}>Tagline Description</label>
              <input type="text" className="source-input" style={{ width: "100%" }} value={editingItem.tagline} onChange={e => setEditingItem({ ...editingItem, tagline: e.target.value })} />
            </div>

            <div>
              <label style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)", display: "block", marginBottom: 4 }}>Full Description</label>
              <textarea rows={3} className="source-input" style={{ width: "100%", padding: "8px 12px" }} value={editingItem.description || ""} onChange={e => setEditingItem({ ...editingItem, description: e.target.value })} />
            </div>

            <div>
              <label style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)", display: "block", marginBottom: 4 }}>Image URL or File Upload</label>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <input type="text" className="source-input" style={{ flex: 1 }} value={editingItem.image} onChange={e => setEditingItem({ ...editingItem, image: e.target.value })} />
                <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>OR</span>
                <label className="btn btn-ghost" style={{ cursor: "pointer", margin: 0, padding: "8px 16px", flexShrink: 0 }}>
                  Upload File
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const formData = new FormData();
                      formData.append("file", file);
                      
                      const token = localStorage.getItem("access_token");
                      try {
                        const res = await fetch(`http://${window.location.hostname}:8000/api/v1/products/catalog/upload-image`, {
                          method: "POST",
                          headers: {
                            ...(token ? { "Authorization": `Bearer ${token}` } : {})
                          },
                          body: formData
                        });
                        if (res.ok) {
                          const data = await res.json();
                          setEditingItem({ ...editingItem, image: data.url });
                          setStatusMsg({ type: "ok", text: "Image uploaded successfully!" });
                        } else {
                          setStatusMsg({ type: "err", text: "Failed to upload image." });
                        }
                      } catch (err) {
                        setStatusMsg({ type: "err", text: "Error uploading image." });
                      }
                    }}
                  />
                </label>
              </div>
            </div>

            <div>
              <label style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)", display: "block", marginBottom: 4 }}>Highlights (Comma separated)</label>
              <input type="text" className="source-input" style={{ width: "100%" }} value={tempHighlights} onChange={e => setTempHighlights(e.target.value)} />
            </div>

            {/* Specifications Key/Value Pair Setup */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <label style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>Specifications</label>
                <button type="button" className="btn btn-ghost btn-xs" onClick={() => setTempSpecs([...tempSpecs, { key: "", value: "" }])}>
                  <Plus size={10} /> Add Row
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {tempSpecs.map((spec, i) => (
                  <div key={i} style={{ display: "flex", gap: 8 }}>
                    <input
                      type="text"
                      placeholder="Specification Key"
                      className="source-input"
                      style={{ flex: 1 }}
                      value={spec.key}
                      onChange={e => {
                        const next = [...tempSpecs];
                        next[i].key = e.target.value;
                        setTempSpecs(next);
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Specification Value"
                      className="source-input"
                      style={{ flex: 1 }}
                      value={spec.value}
                      onChange={e => {
                        const next = [...tempSpecs];
                        next[i].value = e.target.value;
                        setTempSpecs(next);
                      }}
                    />
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setTempSpecs(tempSpecs.filter((_, idx) => idx !== i))}>
                      <Trash size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            {/* Ideal Applications */}
            <div>
              <label style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)", display: "block", marginBottom: 4 }}>Ideal Applications (Comma separated)</label>
              <input type="text" className="source-input" style={{ width: "100%" }} value={tempApplications} onChange={e => setTempApplications(e.target.value)} />
            </div>

            {/* Key Features list */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <label style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>Key Features</label>
                <button type="button" className="btn btn-ghost btn-xs" onClick={() => setTempFeatures([...tempFeatures, { icon: "Zap", title: "", desc: "" }])}>
                  <Plus size={10} /> Add Feature
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {tempFeatures.map((feat, i) => (
                  <div key={i} style={{ display: "flex", flexDirection: "column", gap: 8, padding: 12, background: "rgba(255,255,255,0.01)", border: "1px solid var(--border)", borderRadius: 8 }}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <select
                        className="source-input"
                        style={{ width: 120 }}
                        value={feat.icon}
                        onChange={e => {
                          const next = [...tempFeatures];
                          next[i].icon = e.target.value;
                          setTempFeatures(next);
                        }}
                      >
                        <option value="Zap">Zap (Energy)</option>
                        <option value="Activity">Activity (IoT)</option>
                        <option value="Settings">Settings (Maint)</option>
                        <option value="Cloud">Cloud (Analytics)</option>
                        <option value="Wind">Wind (Weather)</option>
                        <option value="Shield">Shield (Quiet)</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Feature Title"
                        className="source-input"
                        style={{ flex: 1 }}
                        value={feat.title}
                        onChange={e => {
                          const next = [...tempFeatures];
                          next[i].title = e.target.value;
                          setTempFeatures(next);
                        }}
                      />
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setTempFeatures(tempFeatures.filter((_, idx) => idx !== i))}>
                        <Trash size={12} />
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="Feature Description"
                      className="source-input"
                      style={{ width: "100%" }}
                      value={feat.desc}
                      onChange={e => {
                        const next = [...tempFeatures];
                        next[i].desc = e.target.value;
                        setTempFeatures(next);
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>


            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setEditingItem(null)}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={saveProductEdit}>
                <Check size={14} style={{ marginRight: 6 }} /> Apply Changes
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button className="btn btn-primary btn-sm" onClick={handleAddProduct}>
                <Plus size={14} style={{ marginRight: 6 }} /> Add New Product
              </button>
            </div>
            
            <div className="source-card" style={{ overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid var(--border)", textAlign: "left" }}>
                    <th style={{ padding: 12, fontSize: 11, fontFamily: "var(--font-mono)" }}>PRODUCT</th>
                    <th style={{ padding: 12, fontSize: 11, fontFamily: "var(--font-mono)" }}>STATUS</th>
                    <th style={{ padding: 12, fontSize: 11, fontFamily: "var(--font-mono)" }}>TAGLINE</th>
                    <th style={{ padding: 12, fontSize: 11, fontFamily: "var(--font-mono)", textAlign: "right" }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(prod => (
                    <tr key={prod.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: 12, fontSize: 13, fontWeight: 600 }}>{prod.name}</td>
                      <td style={{ padding: 12, fontSize: 12 }}>{prod.status}</td>
                      <td style={{ padding: 12, fontSize: 12, color: "var(--text-secondary)" }}>{prod.tagline}</td>
                      <td style={{ padding: 12, textAlign: "right" }}>
                        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => startEditProduct(prod)}>
                            <Edit size={12} />
                          </button>
                          <button className="btn btn-ghost btn-sm" style={{ color: "var(--error)" }} onClick={() => handleDeleteProduct(prod.id)}>
                            <Trash size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="animate-slide-up" style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      {/* Hero Header */}
      <div style={{ textAlign: "center", padding: "40px 20px", background: "linear-gradient(135deg, rgba(0,123,255,0.05), transparent)", borderRadius: 16, position: "relative" }}>
        {isAdmin && (
          <button 
            className="btn btn-ghost btn-sm" 
            style={{ position: "absolute", top: 12, right: 12 }} 
            onClick={() => setIsEditingCatalog(true)}
          >
            <Edit size={14} style={{ marginRight: 6 }} /> Edit Catalog
          </button>
        )}
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 32, letterSpacing: "-0.02em", color: "var(--text)", marginBottom: 12 }}>
          Renewable Energy Products
        </h1>
        <p style={{ fontSize: 16, color: "var(--text-secondary)", maxWidth: 600, margin: "0 auto", lineHeight: 1.6 }}>
          Explore intelligent airborne wind turbine systems designed for industries, commercial buildings, and smart infrastructure.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 340px))", justifyContent: "center", gap: 24 }}>
        {products.map((product, index) => (
          <div
            key={product.id}
            className="source-card animate-card-entry"
            style={{
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              animationDelay: `${index * 80}ms`
            }}
          >
            <div style={{ height: 220, position: "relative", background: "var(--border)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
              <img src={product.image} alt={product.name} className="card-image" style={{ width: "100%", height: "100%", objectFit: "cover", color: "var(--text-secondary)", fontSize: 12 }} />
              <div style={{ position: "absolute", top: 12, right: 12, background: "rgba(0,0,0,0.65)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.15)", padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, backdropFilter: "blur(4px)" }}>
                {product.status}
              </div>
            </div>
            
            <div style={{ padding: 24, flex: 1, display: "flex", flexDirection: "column" }}>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700, marginBottom: 8, color: "var(--text)" }}>{product.name}</h3>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16, lineHeight: 1.5 }}>{product.tagline}</p>
              
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 24 }}>
                {product.highlights.map((h: any) => (
                  <span key={h} style={{ fontSize: 11, background: "rgba(0,123,255,0.1)", color: "var(--blue)", padding: "4px 8px", borderRadius: 4, fontWeight: 500 }}>
                    {h}
                  </span>
                ))}
              </div>
              
              <div style={{ marginTop: "auto", display: "flex", gap: 8, flexDirection: "column" }}>
                <button 
                  className="btn btn-primary" 
                  style={{ width: "100%", justifyContent: "center" }}
                  onClick={() => setSelectedProduct(product)}
                >
                  View Details <ArrowRight size={14} style={{ marginLeft: 4 }} />
                </button>
                <div style={{ display: "flex", gap: 8 }}>
                  <button 
                    className="btn btn-ghost" 
                    style={{ flex: 1, justifyContent: "center" }}
                    onClick={() => { setSelectedProduct(product); setShowForm("registration"); }}
                  >
                    <Info size={14} style={{ marginRight: 6 }} /> Register
                  </button>
                  <button 
                    className="btn btn-ghost" 
                    style={{ flex: 1, justifyContent: "center" }}
                    onClick={() => { setSelectedProduct(product); setShowForm("consultation"); }}
                  >
                    <Calendar size={14} style={{ marginRight: 6 }} /> Consult
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

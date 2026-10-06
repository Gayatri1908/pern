"use client";
import React, { useState, useEffect } from "react";
import { Package, Search, Plus, RefreshCw, AlertTriangle, CheckCircle, Shield } from "lucide-react";
import { api } from "@/lib/api";
import type { Product, User } from "@/types";

interface InventoryViewProps {
  user: User;
}

export function InventoryView({ user }: InventoryViewProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [restockProduct, setRestockProduct] = useState<Product | null>(null);
  const [newPhysicalQty, setNewPhysicalQty] = useState<number>(0);
  const [saving, setSaving] = useState(false);

  const isAdmin = user.role === "ADMIN" || user.role === "Super Admin";

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await api.products.list();
      setProducts(res.data || []);
    } catch (err: any) {
      alert(err.message || "Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockProduct) return;
    if (newPhysicalQty < restockProduct.reserved_quantity) {
      alert(`Physical stock cannot be less than reserved quantity (${restockProduct.reserved_quantity}).`);
      return;
    }

    setSaving(true);
    try {
      await api.products.updateStock(restockProduct.id, newPhysicalQty);
      setRestockProduct(null);
      await loadProducts();
    } catch (err: any) {
      alert(err.message || "Failed to update stock");
    } finally {
      setSaving(false);
    }
  };

  const filteredProducts = products.filter(p =>
    p.sku.toLowerCase().includes(search.toLowerCase()) ||
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Warehouse Inventory & Stock Availability</h2>
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "4px 0 0" }}>
            Real-time stock monitoring where <strong>Available Stock = Physical Quantity − Reserved Quantity</strong>.
          </p>
        </div>
        <button onClick={loadProducts} className="btn btn-ghost" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <RefreshCw size={14} /> Refresh Stock
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
        <div className="source-card" style={{ padding: 16 }}>
          <span style={{ fontSize: 11, textTransform: "uppercase", color: "var(--text-muted)" }}>Total SKUs</span>
          <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>{products.length}</div>
        </div>
        <div className="source-card" style={{ padding: 16 }}>
          <span style={{ fontSize: 11, textTransform: "uppercase", color: "var(--text-muted)" }}>Total Physical Units</span>
          <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>
            {products.reduce((acc, p) => acc + p.physical_quantity, 0)}
          </div>
        </div>
        <div className="source-card" style={{ padding: 16 }}>
          <span style={{ fontSize: 11, textTransform: "uppercase", color: "var(--warning)" }}>Total Reserved Units</span>
          <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4, color: "var(--warning)" }}>
            {products.reduce((acc, p) => acc + p.reserved_quantity, 0)}
          </div>
        </div>
        <div className="source-card" style={{ padding: 16 }}>
          <span style={{ fontSize: 11, textTransform: "uppercase", color: "var(--green)" }}>Available for Sale</span>
          <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4, color: "var(--green)" }}>
            {products.reduce((acc, p) => acc + p.available_quantity, 0)}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="source-card" style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
        <Search size={16} color="var(--text-muted)" />
        <input
          type="text"
          placeholder="Filter products by SKU or Name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ background: "transparent", border: "none", outline: "none", color: "var(--text)", width: "100%", fontSize: 13 }}
        />
      </div>

      {/* Products Table */}
      <div className="source-card" style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, textAlign: "left" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)", background: "rgba(255,255,255,0.02)", color: "var(--text-muted)", fontSize: 11, textTransform: "uppercase" }}>
              <th style={{ padding: "12px 16px" }}>SKU</th>
              <th style={{ padding: "12px 16px" }}>Product Name & Description</th>
              <th style={{ padding: "12px 16px" }}>Unit Price</th>
              <th style={{ padding: "12px 16px" }}>Physical Quantity</th>
              <th style={{ padding: "12px 16px" }}>Reserved Quantity</th>
              <th style={{ padding: "12px 16px" }}>Available Stock</th>
              <th style={{ padding: "12px 16px" }}>Stock Health</th>
              {isAdmin && <th style={{ padding: "12px 16px", textAlign: "right" }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ padding: 32, textAlign: "center", color: "var(--text-muted)" }}>Loading inventory...</td></tr>
            ) : filteredProducts.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: 32, textAlign: "center", color: "var(--text-muted)" }}>No products match filter.</td></tr>
            ) : (
              filteredProducts.map(p => (
                <tr key={p.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "12px 16px", fontWeight: 700, color: "var(--accent)", fontFamily: "var(--font-mono)" }}>
                    {p.sku}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ fontWeight: 600 }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", maxWidth: 360 }}>{p.description}</div>
                  </td>
                  <td style={{ padding: "12px 16px" }}>₹{p.unit_price.toLocaleString("en-IN")}</td>
                  <td style={{ padding: "12px 16px", fontWeight: 600 }}>{p.physical_quantity}</td>
                  <td style={{ padding: "12px 16px", color: "var(--warning)", fontWeight: 600 }}>{p.reserved_quantity}</td>
                  <td style={{ padding: "12px 16px", fontWeight: 700, fontSize: 14, color: p.available_quantity > 0 ? "var(--green)" : "var(--error)" }}>
                    {p.available_quantity}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{
                      padding: "3px 8px", borderRadius: 12, fontSize: 11, fontWeight: 700,
                      background: p.available_quantity > 5 ? "rgba(34,197,94,0.15)" :
                                  p.available_quantity > 0 ? "rgba(234,179,8,0.15)" : "rgba(239,68,68,0.15)",
                      color: p.available_quantity > 5 ? "var(--green)" :
                             p.available_quantity > 0 ? "var(--warning)" : "var(--error)"
                    }}>
                      {p.available_quantity > 5 ? "Healthy" : p.available_quantity > 0 ? "Low Stock" : "Depleted"}
                    </span>
                  </td>
                  {isAdmin && (
                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                      <button
                        onClick={() => {
                          setRestockProduct(p);
                          setNewPhysicalQty(p.physical_quantity);
                        }}
                        className="btn btn-sm btn-ghost"
                        style={{ padding: "4px 8px", fontSize: 12 }}
                      >
                        Adjust Stock
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Restock Modal */}
      {restockProduct && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
          <div className="source-card" style={{ width: "100%", maxWidth: 420, padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Adjust Physical Stock</h3>
            <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
              Product: <strong>{restockProduct.name}</strong> ({restockProduct.sku})<br />
              Current Reserved Units: <strong>{restockProduct.reserved_quantity}</strong>
            </p>

            <form onSubmit={handleRestock} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                  New Physical Quantity (min {restockProduct.reserved_quantity})
                </label>
                <input
                  type="number"
                  min={restockProduct.reserved_quantity}
                  value={newPhysicalQty}
                  onChange={e => setNewPhysicalQty(parseInt(e.target.value) || 0)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 8, background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)", fontSize: 14 }}
                  required
                />
              </div>

              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                Calculated Available Stock: <strong>{Math.max(0, newPhysicalQty - restockProduct.reserved_quantity)}</strong> units
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
                <button type="button" onClick={() => setRestockProduct(null)} className="btn btn-ghost">Cancel</button>
                <button type="submit" disabled={saving} className="btn btn-primary">
                  {saving ? "Saving..." : "Update Stock"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

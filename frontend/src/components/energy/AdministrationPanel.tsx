"use client";
import React, { useState, useEffect } from "react";
import {
  Users, Settings, History, Shield, Plus,
  RefreshCw, CheckCircle2, AlertTriangle, Save
} from "lucide-react";
import { api } from "@/lib/api";
import type { EnergySystem, SystemConfiguration } from "@/types";

export function AdministrationPanel() {
  const [activeAdminTab, setActiveAdminTab] = useState<"users" | "config" | "audit">("users");
  const [users, setUsers] = useState<any[]>([]);
  const [systems, setSystems] = useState<EnergySystem[]>([]);
  const [selectedSystemId, setSelectedSystemId] = useState<string>("SYS-X1-001");
  const [config, setConfig] = useState<SystemConfiguration | null>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // New user form
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<"Admin" | "Operator">("Operator");
  const [creatingUser, setCreatingUser] = useState(false);

  const loadAdminData = async () => {
    try {
      const [uRes, sRes, aRes] = await Promise.all([
        api.admin.users(),
        api.energySystems.list(),
        api.admin.auditLogs()
      ]);
      if (uRes && uRes.data) setUsers(uRes.data);
      if (sRes && sRes.data) {
        setSystems(sRes.data);
        if (!selectedSystemId && sRes.data.length > 0) setSelectedSystemId(sRes.data[0].id);
      }
      if (aRes && aRes.data) setAuditLogs(aRes.data);
    } catch (err) {
      console.error("Failed to load admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadConfig = async (sysId: string) => {
    try {
      const res = await api.admin.getConfig(sysId);
      if (res && res.data) setConfig(res.data);
    } catch (err) {
      console.error("Failed to load system config:", err);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  useEffect(() => {
    if (selectedSystemId) {
      loadConfig(selectedSystemId);
    }
  }, [selectedSystemId]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingUser(true);
    try {
      await api.admin.createUser({
        email: newUserEmail,
        name: newUserName,
        password: newUserPassword,
        role: newUserRole
      });
      setNewUserEmail("");
      setNewUserName("");
      setNewUserPassword("");
      setSaveSuccess("New platform user provisioned successfully.");
      setTimeout(() => setSaveSuccess(null), 3000);
      const uRes = await api.admin.users();
      if (uRes && uRes.data) setUsers(uRes.data);
    } catch (err: any) {
      alert(err.message || "Failed to create user.");
    } finally {
      setCreatingUser(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;
    try {
      await api.admin.updateConfig(selectedSystemId, config as any);
      setSaveSuccess(`Operating safety envelope updated for ${selectedSystemId}.`);
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch (err: any) {
      alert(err.message || "Failed to update config.");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Admin Tab Switcher */}
      <div className="source-card" style={{ padding: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 10 }}>
            {[
              { id: "users", label: "User Access & Roles", icon: <Users size={14} /> },
              { id: "config", label: "System Operational Envelopes", icon: <Settings size={14} /> },
              { id: "audit", label: "Audit Event Logs", icon: <History size={14} /> }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setActiveAdminTab(t.id as any)}
                className={activeAdminTab === t.id ? "btn btn-primary" : "btn btn-ghost"}
                style={{ fontSize: 11, padding: "8px 14px", display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          <div style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
            <Shield size={13} color="#22c55e" /> Backend RBAC Enforced
          </div>
        </div>
      </div>

      {saveSuccess && (
        <div style={{ padding: "10px 14px", background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 8, color: "#22c55e", fontSize: 12 }}>
          ✓ {saveSuccess}
        </div>
      )}

      {/* 1. User Management */}
      {activeAdminTab === "users" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16 }}>
          <div className="source-card" style={{ padding: 22 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 16px" }}>
              Active Platform Accounts ({users.length})
            </h3>
            <div style={{ overflowX: "auto" }}>
              <table className="source-table" style={{ width: "100%", fontSize: 12 }}>
                <thead>
                  <tr>
                    <th>User ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Last Active</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>{u.id}</td>
                      <td style={{ fontWeight: 600 }}>{u.name}</td>
                      <td style={{ color: "var(--text-secondary)" }}>{u.email}</td>
                      <td>
                        <span style={{
                          padding: "2px 6px",
                          borderRadius: 4,
                          fontSize: 10,
                          fontWeight: 700,
                          background: u.role === "Admin" ? "rgba(139,92,246,0.15)" : "rgba(59,130,246,0.15)",
                          color: u.role === "Admin" ? "#8b5cf6" : "#3b82f6"
                        }}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)" }}>
                        {u.last_login ? new Date(u.last_login).toLocaleDateString("en-IN") : "Never"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Provision New User Form */}
          <div className="source-card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 14px" }}>
              Provision Platform User
            </h3>
            <form onSubmit={handleCreateUser} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Full Name *</label>
                <input className="source-input" type="text" value={newUserName} onChange={e => setNewUserName(e.target.value)} required />
              </div>
              <div>
                <label style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Corporate Email *</label>
                <input className="source-input" type="email" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} required />
              </div>
              <div>
                <label style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Access Password *</label>
                <input className="source-input" type="password" value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} required />
              </div>
              <div>
                <label style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Assigned Role *</label>
                <select className="source-input" value={newUserRole} onChange={e => setNewUserRole(e.target.value as any)}>
                  <option value="Operator">Operator / Field Engineer</option>
                  <option value="Admin">Platform Administrator</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary" style={{ marginTop: 8 }} disabled={creatingUser}>
                {creatingUser ? "Provisioning..." : "Provision User"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2. System Envelopes Configuration */}
      {activeAdminTab === "config" && (
        <div className="source-card" style={{ padding: 22 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>
                Autonomous Flight & Tension Safety Envelopes
              </h3>
              <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "4px 0 0" }}>
                Hardware protection cut-in, cut-out, and tether load trigger thresholds
              </p>
            </div>

            <select
              className="source-input"
              value={selectedSystemId}
              onChange={e => setSelectedSystemId(e.target.value)}
              style={{ width: 220, fontFamily: "var(--font-mono)" }}
            >
              {systems.map(s => (
                <option key={s.id} value={s.id}>{s.id} — {s.model}</option>
              ))}
            </select>
          </div>

          {config ? (
            <form onSubmit={handleSaveConfig} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
              <div>
                <label style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Cut-in Wind Speed (m/s)</label>
                <input
                  className="source-input"
                  type="number"
                  step="0.1"
                  value={config.cut_in_wind_speed}
                  onChange={e => setConfig({ ...config, cut_in_wind_speed: parseFloat(e.target.value) })}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Cut-out Storm Speed (m/s)</label>
                <input
                  className="source-input"
                  type="number"
                  step="0.1"
                  value={config.cut_out_wind_speed}
                  onChange={e => setConfig({ ...config, cut_out_wind_speed: parseFloat(e.target.value) })}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Max Flight Altitude (m)</label>
                <input
                  className="source-input"
                  type="number"
                  value={config.max_altitude_m}
                  onChange={e => setConfig({ ...config, max_altitude_m: parseFloat(e.target.value) })}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Max Dynamic Tether Tension (kN)</label>
                <input
                  className="source-input"
                  type="number"
                  step="0.5"
                  value={config.max_tension_kn}
                  onChange={e => setConfig({ ...config, max_tension_kn: parseFloat(e.target.value) })}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Max Rotor RPM Cutoff</label>
                <input
                  className="source-input"
                  type="number"
                  value={config.max_rotor_rpm}
                  onChange={e => setConfig({ ...config, max_rotor_rpm: parseFloat(e.target.value) })}
                  required
                />
              </div>

              <div style={{ display: "flex", alignItems: "flex-end" }}>
                <button type="submit" className="btn btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: 6, height: 38 }}>
                  <Save size={14} /> Update Operating Envelope
                </button>
              </div>
            </form>
          ) : (
            <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)" }}>
              Loading configuration envelope...
            </div>
          )}
        </div>
      )}

      {/* 3. Audit Logs */}
      {activeAdminTab === "audit" && (
        <div className="source-card" style={{ padding: 22 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 16px" }}>
            Immutable Operational & Security Audit Trail
          </h3>

          <div style={{ overflowX: "auto" }}>
            <table className="source-table" style={{ width: "100%", fontSize: 12 }}>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Event Type</th>
                  <th>Subsystem / Source</th>
                  <th>Severity</th>
                  <th>System ID</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log, idx) => (
                  <tr key={idx}>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>
                      {new Date(log.created_at).toLocaleString("en-IN")}
                    </td>
                    <td style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--accent, #007bff)" }}>
                      {log.event_type}
                    </td>
                    <td>{log.event_source}</td>
                    <td>
                      <span style={{
                        fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4,
                        background: log.severity === "CRITICAL" ? "rgba(239,68,68,0.15)" : (log.severity === "WARNING" ? "rgba(245,158,11,0.15)" : "rgba(59,130,246,0.15)"),
                        color: log.severity === "CRITICAL" ? "#ef4444" : (log.severity === "WARNING" ? "#f59e0b" : "#3b82f6")
                      }}>
                        {log.severity}
                      </span>
                    </td>
                    <td style={{ fontFamily: "var(--font-mono)" }}>{log.system_id || "—"}</td>
                    <td style={{ color: "var(--text)" }}>{log.description}</td>
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

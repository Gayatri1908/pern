"use client";
// ============================================================
// UsersPanel — Admin-only user management
// ============================================================
import React, { useEffect, useState, useCallback } from "react";
import { RefreshCw, Search, Shield, ShieldAlert, ShieldOff, Trash2, AlertTriangle, Clock, Check, X, Mail, Phone, Key } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DataTable } from "@/components/ui/DataTable";
import { api } from "@/lib/api";
import type { User, UserRole } from "@/types";
import { formatUserId, formatCompanyId } from "@/lib/idGenerator";

interface UsersPanelProps {
  currentUserRole?: UserRole;
  currentUserId?: string;
}

export function UsersPanel({ currentUserRole = "Admin", currentUserId }: UsersPanelProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<"all" | "Pending Approvals" | "Admin" | "Customer" | "Pending Deletion">("all");
  const [error, setError] = useState<string | null>(null);

  function canDeleteUser(targetUser: User): boolean {
    if (targetUser.role === "Super Admin") return false;
    if (currentUserRole === "Super Admin") {
      return targetUser.role === "Admin";
    }
    if (currentUserRole === "Admin") {
      return targetUser.role === "Customer";
    }
    return false;
  }

  // Add User Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newRole, setNewRole] = useState<"Admin" | "Customer">("Customer");
  const [newPassword, setNewPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Selected User for details modal
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    type: "toggle" | "delete";
    user: User;
  } | null>(null);

  // Admin Reset Password Modal State
  const [resetPwdUser, setResetPwdUser] = useState<User | null>(null);
  const [adminNewPassword, setAdminNewPassword] = useState("");
  const [resetSuccessMsg, setResetSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedUser(null);
        setShowAddModal(false);
        setConfirmModal(null);
        setResetPwdUser(null);
      }
    };
    if (selectedUser || showAddModal || confirmModal || resetPwdUser) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedUser, showAddModal, confirmModal, resetPwdUser]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (filterRole !== "all" && filterRole !== "Pending Deletion") params.role = filterRole;
      const data = await api.users.list(params) as User[];
      
      const rawUsers = Array.isArray(data) ? data : [];
      let filtered = [...rawUsers];

      if (search.trim()) {
        const q = search.toLowerCase().trim();
        filtered = filtered.filter(u => {
          const email = (u.email || "").toLowerCase();
          const phone = (u.phone || "").toLowerCase();
          const companyName = (u.company?.name || "").toLowerCase();
          const role = (u.role || "").toLowerCase();
          const approvalStatus = (u.approval_status || "").toLowerCase();
          const customId = formatUserId(u).toLowerCase();
          const companyId = formatCompanyId(u.company || u.company_id).toLowerCase();
          const uuid = (u.id || "").toLowerCase();
          const joined = new Date(u.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }).toLowerCase();

          return (
            email.includes(q) ||
            phone.includes(q) ||
            companyName.includes(q) ||
            role.includes(q) ||
            approvalStatus.includes(q) ||
            customId.includes(q) ||
            companyId.includes(q) ||
            uuid.includes(q) ||
            joined.includes(q)
          );
        });
      }

      const sorted = [...filtered].sort((a, b) => {
        // 1. Super Admin at top
        const aSA = a.role === "Super Admin";
        const bSA = b.role === "Super Admin";
        if (aSA && !bSA) return -1;
        if (!aSA && bSA) return 1;

        // 2. Admins second
        const aAdmin = a.role === "Admin";
        const bAdmin = b.role === "Admin";
        if (aAdmin && !bAdmin) return -1;
        if (!aAdmin && bAdmin) return 1;

        // 3. Approved / Verified users on top, Pending users at bottom
        const aApproved = a.approval_status === "approved";
        const bApproved = b.approval_status === "approved";
        if (aApproved && !bApproved) return -1;
        if (!aApproved && bApproved) return 1;

        // 4. Ascending order by creation timestamp
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });
      
      setUsers(sorted);
    } catch (e) { setError(String(e)); }
    finally { setLoading(false); }
  }, [search, filterRole]);

  useEffect(() => {
    const t = setTimeout(() => load(), 350);
    return () => clearTimeout(t);
  }, [load]);

  function toggleActive(user: User) {
    setConfirmModal({ type: "toggle", user });
  }

  function deleteUser(user: User) {
    if (user.role === "Admin") {
      setError("Admin accounts cannot be deleted for security and auditing reasons.");
      return;
    }
    setConfirmModal({ type: "delete", user });
  }

  async function executeToggleActive(user: User) {
    try {
      await api.users.update(user.id, { is_active: !user.is_active });
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: !user.is_active } : u));
    } catch (e) { setError(String(e)); }
    finally { setConfirmModal(null); }
  }

  async function executeDeleteUser(user: User) {
    try {
      await api.users.delete(user.id);
      setUsers(prev => prev.filter(u => u.id !== user.id));
    } catch (e) { setError(String(e)); }
    finally { setConfirmModal(null); }
  }

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault();
    if (!newEmail || !newPassword) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.users.create({
        email: newEmail,
        phone: newPhone || undefined,
        role: newRole,
        password: newPassword,
      });
      setShowAddModal(false);
      setNewEmail("");
      setNewPhone("");
      setNewRole("Customer");
      setNewPassword("");
      load();
    } catch (err) {
      setError(String(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAdminResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!resetPwdUser || !adminNewPassword) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.users.update(resetPwdUser.id, { password: adminNewPassword });
      setResetSuccessMsg(`Password for ${resetPwdUser.email} reset successfully!`);
      setTimeout(() => {
        setResetPwdUser(null);
        setAdminNewPassword("");
        setResetSuccessMsg(null);
      }, 1500);
    } catch (err) {
      setError(String(err));
    } finally {
      setSubmitting(false);
    }
  }

  const [verificationNotesInput, setVerificationNotesInput] = useState("");

  async function handleApprove(u: User) {
    try {
      setLoading(true);
      await api.users.approve(u.id, verificationNotesInput || undefined);
      setSelectedUser(null);
      setVerificationNotesInput("");
      load();
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleReject(u: User) {
    try {
      setLoading(true);
      await api.users.reject(u.id, verificationNotesInput || undefined);
      setSelectedUser(null);
      setVerificationNotesInput("");
      load();
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  const columns = [
    { key: "id", label: "User ID", sortable: true, render: (u: User) => (
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: u.role === "Super Admin" ? "#c084fc" : "var(--text-muted)", fontWeight: u.role === "Super Admin" ? 700 : 400 }}>
        {formatUserId(u)}
      </span>
    )},
    { key: "email", label: "Customer & Contact", sortable: true, render: (u: User) => (
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {u.company?.name && (
          <span style={{ fontWeight: 600, color: "var(--text)", fontSize: 13 }}>
            {u.company.name}
          </span>
        )}
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: u.company?.name ? "var(--text-secondary)" : "var(--text)" }}>{u.email}</span>
        {u.phone && <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{u.phone}</span>}
      </div>
    )},
    { key: "role", label: "Role", sortable: true, render: (u: User) => (
      <span className={`badge ${u.role === "Super Admin" ? "badge-failed" : u.role === "Admin" ? "badge-info" : "badge-offline"}`} style={{
        background: u.role === "Super Admin" ? "rgba(147, 51, 234, 0.15)" : undefined,
        color: u.role === "Super Admin" ? "#c084fc" : undefined,
        border: u.role === "Super Admin" ? "1px solid rgba(147, 51, 234, 0.3)" : undefined
      }}>
        {u.role === "Super Admin" ? <ShieldAlert size={10} color="#c084fc" /> : u.role === "Admin" ? <Shield size={10} /> : null}
        {u.role}
      </span>
    )},
    { key: "approval_status", label: "Verification Status", sortable: true, render: (u: User) => (
      <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-start" }}>
        {u.approval_status === "pending" ? (
          <span className="badge badge-warn" title="Requires identity verification">
            <Clock size={10} style={{ marginRight: 4 }} /> Pending Approval
          </span>
        ) : u.approval_status === "rejected" ? (
          <span className="badge badge-failed">
            <X size={10} style={{ marginRight: 4 }} /> Rejected
          </span>
        ) : (
          <span className="badge badge-online">
            <Check size={10} style={{ marginRight: 4 }} /> Approved
          </span>
        )}
        {u.deletion_requested_at && (
          <span style={{ fontSize: 10, color: "var(--error)", display: "flex", alignItems: "center", gap: 4 }} title={`Reason: ${u.deletion_reason || 'N/A'}`}>
            <AlertTriangle size={10} /> Pending Deletion
          </span>
        )}
      </div>
    )},
    { key: "created_at", label: "Joined", sortable: true, render: (u: User) => (
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>
        {new Date(u.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
      </span>
    )},
    {
      key: "actions", label: "Actions",
      render: (u: User) => {
        const canDel = canDeleteUser(u);
        return (
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {u.role === "Super Admin" ? (
              <span style={{ fontSize: 10, color: "#c084fc", fontWeight: 700, fontFamily: "var(--font-mono)", padding: "2px 8px", background: "rgba(147,51,234,0.12)", border: "1px solid rgba(147,51,234,0.25)", borderRadius: 6 }}>
                PROTECTED
              </span>
            ) : (
              <>
                {u.approval_status === "pending" && (
                  <button
                    onClick={e => { e.stopPropagation(); setSelectedUser(u); }}
                    className="btn btn-sm btn-primary"
                    title="Review & Verify Account"
                  >
                    Verify
                  </button>
                )}
                <button
                  onClick={e => { e.stopPropagation(); toggleActive(u); }}
                  className={`btn btn-sm ${u.is_active ? "btn-danger" : "btn-success"}`}
                  title={u.id === currentUserId ? "You cannot deactivate your own account" : (u.is_active ? "Deactivate" : "Activate")}
                  disabled={u.id === currentUserId}
                  style={u.id === currentUserId ? { opacity: 0.4, cursor: "not-allowed" } : {}}
                >
                  {u.is_active ? <ShieldOff size={11} /> : <Shield size={11} />}
                </button>
                {canDel && (
                  <button
                    onClick={e => { e.stopPropagation(); deleteUser(u); }}
                    className="btn btn-sm btn-danger"
                    title="Delete Account"
                  >
                    <Trash2 size={11} />
                  </button>
                )}
              </>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <>
      <div className="animate-slide-up" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, letterSpacing: "0.04em", textTransform: "uppercase" }}>
          User Management
        </h2>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)}>
            + Add User
          </button>
          <button className="btn btn-ghost btn-sm" onClick={load}>
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: "rgba(229,72,77,0.1)", border: "1px solid rgba(229,72,77,0.2)", borderRadius: 10, padding: "10px 14px", color: "var(--error)", fontSize: 12 }}>
          {error}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, maxWidth: 300 }}>
          <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input
            className="source-input"
            style={{ paddingLeft: 30 }}
            placeholder="Search by name, email, phone, ID, role..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {(["all", "Pending Approvals", "Admin", "Customer", "Pending Deletion"] as const).map(r => (
          <button
            key={r}
            onClick={() => setFilterRole(r as any)}
            className={`btn btn-sm ${filterRole === r ? "btn-primary" : "btn-ghost"}`}
          >
            {r === "Pending Approvals" ? (
              <>
                <Clock size={11} style={{ marginRight: 4 }} /> Pending Verification ({users.filter(u => u.approval_status === "pending").length})
              </>
            ) : (
              r
            )}
          </button>
        ))}
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-muted)", marginLeft: "auto" }}>
          {users.length} users
        </span>
      </div>

      <div className="source-card" style={{ overflow: "hidden" }}>
        <DataTable<User>
          columns={columns}
          data={
            filterRole === "Pending Approvals"
              ? users.filter(u => u.approval_status === "pending")
              : filterRole === "Pending Deletion"
              ? users.filter(u => u.deletion_requested_at)
              : filterRole === "Admin" || filterRole === "Customer"
              ? users.filter(u => u.role === filterRole)
              : users
          }
          keyFn={u => u.id}
          loading={loading}
          emptyMessage="No users found matching filter."
          onRowClick={setSelectedUser}
        />
      </div>
    </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.6)",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          zIndex: 1000,
          backdropFilter: "blur(4px)",
          overflowY: "auto",
          padding: "40px 16px"
        }}>
          <div className="source-card" style={{ width: "100%", maxWidth: 450, padding: 24, display: "flex", flexDirection: "column", gap: 20, position: "relative" }}>
            <button 
              type="button"
              onClick={() => setShowAddModal(false)}
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                background: "none",
                border: "none",
                color: "var(--text-muted)",
                cursor: "pointer",
                padding: 4,
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
              title="Close"
            >
              <X size={16} />
            </button>

            <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, textTransform: "uppercase", letterSpacing: "0.02em", paddingRight: 24 }}>
              Add New User / Admin
            </h3>
            
            <form onSubmit={handleAddUser} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>Email Address</label>
                <input
                  type="email"
                  required
                  className="source-input"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  placeholder="name@example.com"
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>Phone Number (Optional)</label>
                <input
                  type="text"
                  className="source-input"
                  value={newPhone}
                  onChange={e => setNewPhone(e.target.value)}
                  placeholder="+91 XXXXXXXXXX"
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>Account Role</label>
                <select
                  className="source-input"
                  value={newRole}
                  onChange={e => setNewRole(e.target.value as any)}
                  style={{ background: "#0f172a", color: "#f8fafc" }}
                >
                  <option value="Customer" style={{ backgroundColor: "#ffffff", color: "#0f172a" }}>Customer</option>
                  <option value="Admin" style={{ backgroundColor: "#ffffff", color: "#0f172a" }}>Admin</option>
                </select>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>Password</label>
                <input
                  type="password"
                  required
                  className="source-input"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowAddModal(false)} style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting} style={{ flex: 1 }}>
                  {submitting ? "Creating..." : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {selectedUser && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.6)",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          zIndex: 1000,
          backdropFilter: "blur(4px)",
          overflowY: "auto",
          padding: "40px 16px"
        }}>
          <div className="source-card animate-slide-up" style={{ width: "100%", maxWidth: 500, padding: 24, display: "flex", flexDirection: "column", gap: 20, position: "relative" }}>
            <button 
              onClick={() => setSelectedUser(null)}
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                background: "none",
                border: "none",
                color: "var(--text-muted)",
                cursor: "pointer",
                padding: 4,
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
              title="Close"
            >
              <X size={16} />
            </button>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingRight: 24 }}>
              <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, textTransform: "uppercase", letterSpacing: "0.02em" }}>
                User Details
              </h3>
              <span className={`badge ${selectedUser.role === "Admin" ? "badge-info" : "badge-offline"}`}>
                {selectedUser.role}
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 8, fontSize: 13 }}>
                <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>User ID:</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: selectedUser.role === "Super Admin" ? "#c084fc" : "var(--text)", fontWeight: selectedUser.role === "Super Admin" ? 700 : 400 }}>
                  {formatUserId(selectedUser)}
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 8, fontSize: 13 }}>
                <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>Email:</span>
                <span>{selectedUser.email}</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 8, fontSize: 13 }}>
                <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>Phone:</span>
                <span>{selectedUser.phone || "—"}</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 8, fontSize: 13 }}>
                <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>Status:</span>
                <div>
                  <StatusBadge status={selectedUser.is_active ? "online" : "offline"} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 8, fontSize: 13 }}>
                <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>Joined:</span>
                <span>{new Date(selectedUser.created_at).toLocaleString("en-IN")}</span>
              </div>

              {selectedUser.company ? (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 8, fontSize: 13 }}>
                    <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>Company ID:</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--accent)" }}>{formatCompanyId(selectedUser.company)}</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 8, fontSize: 13 }}>
                    <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>Company Name:</span>
                    <span style={{ fontWeight: 600, color: "var(--text)" }}>{selectedUser.company.name}</span>
                  </div>
                  {selectedUser.company.company_type && (
                    <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 8, fontSize: 13 }}>
                      <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>Company Type:</span>
                      <span style={{ textTransform: "capitalize" }}>{selectedUser.company.company_type}</span>
                    </div>
                  )}
                  {(selectedUser.company.gst_no || selectedUser.company.gst_number) && (
                    <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 8, fontSize: 13 }}>
                      <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>GST Number:</span>
                      <span style={{ fontFamily: "var(--font-mono)" }}>{selectedUser.company.gst_no || selectedUser.company.gst_number}</span>
                    </div>
                  )}
                  {selectedUser.company.address && (
                    <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 8, fontSize: 13 }}>
                      <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>Address:</span>
                      <span>{selectedUser.company.address}</span>
                    </div>
                  )}
                </>
              ) : selectedUser.company_id ? (
                <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 8, fontSize: 13 }}>
                  <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>Company ID:</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--accent)" }}>{formatCompanyId(selectedUser.company_id)}</span>
                </div>
              ) : null}

              <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 8, fontSize: 13 }}>
                <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>Verification:</span>
                <div>
                  {selectedUser.approval_status === "pending" ? (
                    <span className="badge badge-warn"><Clock size={10} style={{ marginRight: 4 }} /> Pending Verification</span>
                  ) : selectedUser.approval_status === "rejected" ? (
                    <span className="badge badge-failed"><X size={10} style={{ marginRight: 4 }} /> Rejected</span>
                  ) : (
                    <span className="badge badge-online"><Check size={10} style={{ marginRight: 4 }} /> Approved & Active</span>
                  )}
                </div>
              </div>

              {/* Quick Contact Buttons */}
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                {selectedUser.phone && (
                  <a
                    href={`tel:${selectedUser.phone}`}
                    className="btn btn-sm btn-ghost"
                    style={{ flex: 1, justifyContent: "center", textDecoration: "none", fontSize: 11 }}
                  >
                    <Phone size={11} style={{ marginRight: 4 }} /> Call User ({selectedUser.phone})
                  </a>
                )}
                <a
                  href={`mailto:${selectedUser.email}?subject=Identity%20Verification%20-%20The%20Source%20Company`}
                  className="btn btn-sm btn-ghost"
                  style={{ flex: 1, justifyContent: "center", textDecoration: "none", fontSize: 11 }}
                >
                  <Mail size={11} style={{ marginRight: 4 }} /> Email User
                </a>
                {selectedUser.role !== "Super Admin" && (
                  <button
                    type="button"
                    className="btn btn-sm btn-ghost"
                    onClick={() => setResetPwdUser(selectedUser)}
                    style={{ flex: 1, justifyContent: "center", fontSize: 11 }}
                  >
                    <Key size={11} style={{ marginRight: 4 }} /> Reset Password
                  </button>
                )}
              </div>

              {/* Verification Notes Input for Admin */}
              {selectedUser.role !== "Super Admin" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>Admin Verification Notes</label>
                  <textarea
                    className="source-input"
                    rows={2}
                    placeholder="Enter identity verification notes, phone call result, or rejection reason..."
                    value={verificationNotesInput}
                    onChange={e => setVerificationNotesInput(e.target.value)}
                    style={{ resize: "none" }}
                  />
                  {selectedUser.verification_notes && (
                    <span style={{ fontSize: 11, color: "var(--text-muted)", fontStyle: "italic" }}>
                      Previous notes: {selectedUser.verification_notes}
                    </span>
                  )}
                </div>
              )}

              {selectedUser.deletion_requested_at && (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 8, fontSize: 13, color: "var(--error)" }}>
                    <span style={{ fontWeight: 600 }}>Deletion Requested:</span>
                    <span>{new Date(selectedUser.deletion_requested_at).toLocaleString("en-IN")}</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 8, fontSize: 13 }}>
                    <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>Deletion Reason:</span>
                    <span style={{ color: "var(--error)", background: "rgba(229,72,77,0.05)", padding: "6px 10px", borderRadius: 6, border: "1px solid rgba(229,72,77,0.1)" }}>
                      {selectedUser.deletion_reason || "No reason provided."}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Modal Actions: Approve / Reject / Close / Delete */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
              {selectedUser.approval_status === "pending" && (
                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    className="btn btn-success"
                    onClick={() => handleApprove(selectedUser)}
                    style={{ flex: 1, justifyContent: "center" }}
                  >
                    <Check size={13} style={{ marginRight: 4 }} /> Approve Registration
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleReject(selectedUser)}
                    style={{ flex: 1, justifyContent: "center" }}
                  >
                    <X size={13} style={{ marginRight: 4 }} /> Reject Request
                  </button>
                </div>
              )}
              {canDeleteUser(selectedUser) && (
                <div style={{ display: "flex", width: "100%" }}>
                  <button
                    className="btn btn-danger"
                    onClick={() => {
                      const u = selectedUser;
                      setSelectedUser(null);
                      deleteUser(u);
                    }}
                    style={{ flex: 1, justifyContent: "center" }}
                  >
                    <Trash2 size={12} style={{ marginRight: 6 }} /> Delete Account
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* UI Confirmation Modal Popup for Deactivation / Activation / Deletion */}
      {confirmModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.65)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1100,
          backdropFilter: "blur(4px)",
          padding: "20px"
        }}>
          <div className="source-card animate-slide-up" style={{ width: "100%", maxWidth: 440, padding: 24, display: "flex", flexDirection: "column", gap: 16, position: "relative" }}>
            <button 
              type="button"
              onClick={() => setConfirmModal(null)}
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                background: "none",
                border: "none",
                color: "var(--text-muted)",
                cursor: "pointer",
                padding: 4,
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
              title="Close (Esc)"
            >
              <X size={16} />
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: confirmModal.type === "delete" || confirmModal.user.is_active ? "rgba(229,72,77,0.15)" : "rgba(50,205,50,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: confirmModal.type === "delete" || confirmModal.user.is_active ? "var(--error)" : "var(--green)",
                flexShrink: 0
              }}>
                {confirmModal.type === "delete" ? <AlertTriangle size={20} /> : confirmModal.user.is_active ? <ShieldOff size={20} /> : <Shield size={20} />}
              </div>
              <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, textTransform: "uppercase", letterSpacing: "0.02em" }}>
                {confirmModal.type === "delete" 
                  ? "Confirm Account Deletion" 
                  : confirmModal.user.is_active 
                    ? "Deactivate Account" 
                    : "Activate Account"}
              </h3>
            </div>

            <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 }}>
              {confirmModal.type === "delete" ? (
                <>Are you sure you want to permanently delete user account <strong style={{ color: "var(--text)" }}>{confirmModal.user.email}</strong>? This action cannot be undone.</>
              ) : confirmModal.user.is_active ? (
                <>Are you sure you want to deactivate <strong style={{ color: "var(--text)" }}>{confirmModal.user.email}</strong>? They will temporarily lose portal login access.</>
              ) : (
                <>Are you sure you want to activate <strong style={{ color: "var(--text)" }}>{confirmModal.user.email}</strong>? They will regain immediate portal access.</>
              )}
            </p>

            <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
              <button className="btn btn-ghost" onClick={() => setConfirmModal(null)} style={{ flex: 1 }}>
                Cancel
              </button>
              <button 
                className={`btn ${confirmModal.type === "delete" || confirmModal.user.is_active ? "btn-danger" : "btn-success"}`} 
                onClick={() => confirmModal.type === "delete" ? executeDeleteUser(confirmModal.user) : executeToggleActive(confirmModal.user)} 
                style={{ flex: 1, justifyContent: "center" }}
              >
                {confirmModal.type === "delete" 
                  ? "Delete Account" 
                  : confirmModal.user.is_active 
                    ? "Deactivate Account" 
                    : "Activate Account"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Reset User Password UI Modal Popup */}
      {resetPwdUser && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.65)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1100,
          backdropFilter: "blur(4px)",
          padding: "20px"
        }}>
          <div className="source-card animate-slide-up" style={{ width: "100%", maxWidth: 440, padding: 24, display: "flex", flexDirection: "column", gap: 16, position: "relative" }}>
            <button 
              type="button"
              onClick={() => { setResetPwdUser(null); setAdminNewPassword(""); setResetSuccessMsg(null); }}
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                background: "none",
                border: "none",
                color: "var(--text-muted)",
                cursor: "pointer",
                padding: 4,
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
              title="Close (Esc)"
            >
              <X size={16} />
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(0,123,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent)" }}>
                <Key size={18} />
              </div>
              <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, textTransform: "uppercase", letterSpacing: "0.02em", margin: 0 }}>
                Reset User Password
              </h3>
            </div>

            <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>
              Set a new password for account <strong style={{ color: "var(--text)" }}>{resetPwdUser.email}</strong>.
            </p>

            {resetSuccessMsg && (
              <div style={{ color: "var(--green)", fontSize: 12, background: "rgba(50,205,50,0.1)", border: "1px solid rgba(50,205,50,0.2)", padding: "8px 12px", borderRadius: 8 }}>
                {resetSuccessMsg}
              </div>
            )}

            <form onSubmit={handleAdminResetPassword} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)", textTransform: "uppercase", display: "block", marginBottom: 4 }}>New Password *</label>
                <input
                  className="source-input"
                  type="password"
                  value={adminNewPassword}
                  placeholder="Enter new password"
                  onChange={e => setAdminNewPassword(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button type="button" className="btn btn-ghost" onClick={() => { setResetPwdUser(null); setAdminNewPassword(""); setResetSuccessMsg(null); }} style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: "center" }} disabled={submitting}>
                  {submitting ? "Updating..." : "Set Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

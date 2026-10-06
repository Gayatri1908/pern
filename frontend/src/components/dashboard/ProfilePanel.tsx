"use client";
// ============================================================
// ProfilePanel — user profile and session management
// ============================================================
import React, { useState, useEffect } from "react";
import { Shield, Clock, Smartphone, Mail, LogIn, Key, Cpu, Edit, Check, X } from "lucide-react";
import { apiFetch } from "@/lib/api";
import type { User } from "@/types";
import { formatUserId, formatCompanyId } from "@/lib/idGenerator";

interface Props { user: User | null; onLogout: () => void; onUpdate?: (u: User) => void; }

export function ProfilePanel({ user, onLogout, onUpdate }: Props) {
  const [changingPwd, setChangingPwd] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHist, setLoadingHist] = useState(false);
  const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" });
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Edit Profile UI Modal & OTP Verification State
  const [editProfileModal, setEditProfileModal] = useState(false);
  const [showLoginHistoryModal, setShowLoginHistoryModal] = useState(false);
  const [otpStep, setOtpStep] = useState<1 | 2>(1);
  const [newEmailInput, setNewEmailInput] = useState(user?.email || "");
  const [newPhoneInput, setNewPhoneInput] = useState(user?.phone || "");
  const [otpInput, setOtpInput] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [otpTarget, setOtpTarget] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSending, setOtpSending] = useState(false);
  const [otpTimer, setOtpTimer] = useState<number>(0);

  useEffect(() => {
    let timer: any;
    if (otpTimer > 0) {
      timer = setInterval(() => {
        setOtpTimer(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [otpTimer]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setChangingPwd(false);
        setEditProfileModal(false);
        setShowLoginHistoryModal(false);
        setMsg(null);
        setOtpError(null);
      }
    };
    if (changingPwd || editProfileModal || showLoginHistoryModal) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [changingPwd, editProfileModal, showLoginHistoryModal]);

  async function handleRequestOTP(e: React.FormEvent) {
    e.preventDefault();
    setOtpError(null);

    const emailChanged = newEmailInput !== user?.email;
    const phoneChanged = newPhoneInput !== (user?.phone || "");

    if (!emailChanged && !phoneChanged) {
      setOtpError("No changes detected in your email or phone number.");
      return;
    }

    setOtpSending(true);
    try {
      const res = await apiFetch("/api/v1/auth/profile/request-otp", {
        method: "POST",
        body: JSON.stringify({
          email: emailChanged ? newEmailInput : undefined,
          phone: phoneChanged ? newPhoneInput : undefined,
        })
      }) as any;

      setGeneratedOtp(res.otp);
      setOtpTarget(res.target);
      setOtpStep(2);
      setOtpTimer(180);
    } catch (err) {
      setOtpError(String(err));
    } finally {
      setOtpSending(false);
    }
  }

  async function handleVerifyOTP(e: React.FormEvent) {
    e.preventDefault();
    if (!otpInput) return;
    setOtpError(null);
    setLoading(true);
    try {
      const updatedUser = await apiFetch("/api/v1/auth/profile/verify-otp", {
        method: "POST",
        body: JSON.stringify({
          otp: otpInput,
          email: newEmailInput !== user?.email ? newEmailInput : undefined,
          phone: newPhoneInput !== (user?.phone || "") ? newPhoneInput : undefined,
        })
      }) as User;

      triggerToast("Profile updated successfully with OTP verification!");
      setEditProfileModal(false);
      setOtpStep(1);
      setOtpInput("");
      setGeneratedOtp(null);
      if (onUpdate) onUpdate(updatedUser);
    } catch (err) {
      setOtpError(String(err));
    } finally {
      setLoading(false);
    }
  }

  const triggerToast = (txt: string) => {
    setToast(txt);
    setTimeout(() => setToast(null), 3000);
  };

  const [deleteReason, setDeleteReason] = useState("");

  async function requestProfileDeletion() {
    if (!deleteReason.trim()) return;
    setLoading(true);
    try {
      const updatedUser = await apiFetch("/api/v1/auth/users/me/deactivate", {
        method: "POST",
        body: JSON.stringify({ reason: deleteReason })
      }) as User;
      triggerToast("Deletion request submitted! Your profile will be deleted after 30 days.");
      setDeleteReason("");
      if (onUpdate) onUpdate(updatedUser);
    } catch (e) {
      triggerToast(String(e));
    } finally {
      setLoading(false);
    }
  }

  async function cancelDeletionRequest() {
    setLoading(true);
    try {
      const updatedUser = await apiFetch("/api/v1/auth/users/me/cancel-deactivation", {
        method: "POST"
      }) as User;
      triggerToast("Deletion request cancelled successfully.");
      if (onUpdate) onUpdate(updatedUser);
    } catch (e) {
      triggerToast(String(e));
    } finally {
      setLoading(false);
    }
  }



  async function submitPwd(e: React.FormEvent) {
    e.preventDefault();
    if (pwd.next !== pwd.confirm) { setMsg({ type: "err", text: "Passwords do not match." }); return; }
    if (pwd.next.length < 8) { setMsg({ type: "err", text: "Password must be at least 8 characters." }); return; }
    setLoading(true); setMsg(null);
    try {
      await apiFetch("/api/v1/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ current_password: pwd.current, new_password: pwd.next }),
      });
      setMsg({ type: "ok", text: "Password changed successfully." });
      setPwd({ current: "", next: "", confirm: "" });
      setChangingPwd(false);
    } catch (e) { setMsg({ type: "err", text: String(e) }); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    if (!user?.id) return;
    setLoadingHist(true);
    apiFetch(`/api/v1/auth/users/${user.id}/login-history`)
      .then((data: any) => {
        setHistory(Array.isArray(data) ? data : []);
      })
      .catch(() => {})
      .finally(() => setLoadingHist(false));
  }, [user?.id]);

  const initials = user?.email?.substring(0, 2).toUpperCase() ?? "??";

  return (
    <div className="animate-slide-up" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {toast && (
        <div style={{
          background: "rgba(0,123,255,0.1)",
          border: "1px solid rgba(0,123,255,0.2)",
          borderRadius: 8, padding: "10px 14px",
          color: "var(--accent)", fontSize: 12
        }}>
          {toast}
        </div>
      )}


      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
        gap: 20
      }}>
        {/* Personal Details Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Avatar card */}
          <div className="source-card" style={{ padding: 24, display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%",
              background: "linear-gradient(135deg, var(--accent), #0052cc)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 22,
              color: "white", flexShrink: 0, boxShadow: "0 0 0 4px rgba(0,123,255,0.15)",
            }}>
              {initials}
            </div>
            <div>
              <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, color: "var(--text)" }}>
                {user?.email ?? "—"}
              </p>
              <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                <span className={`badge ${user?.role === "Admin" ? "badge-info" : "badge-online"}`}>
                  <Shield size={10} />
                  {user?.role}
                </span>
                <span className={`badge ${user?.is_active ? "badge-online" : "badge-offline"}`}>
                  {user?.is_active ? "Active" : "Inactive"}
                </span>
                {user?.is_2fa_enabled && (
                  <span className="badge badge-online"><Shield size={10} /> 2FA Enabled</span>
                )}
              </div>
            </div>
          </div>

          {/* Info grid */}
          <div className="source-card" style={{ padding: 20, flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", margin: 0 }}>
                Account Details
              </p>
              <button
                className="btn btn-sm btn-primary"
                onClick={() => {
                  setEditProfileModal(true);
                  setOtpStep(1);
                  setNewEmailInput(user?.email || "");
                  setNewPhoneInput(user?.phone || "");
                  setOtpInput("");
                  setOtpError(null);
                }}
              >
                <Edit size={12} style={{ marginRight: 4 }} /> Edit Profile
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Email */}
              <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, color: "var(--text-muted)" }}>
                  <Mail size={13} />
                  <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Email Address</span>
                </div>
                <span style={{ fontSize: 13, color: "var(--text)", display: "block", marginTop: 4, fontWeight: 500 }}>{user?.email ?? "—"}</span>
              </div>

              {/* Phone */}
              <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, color: "var(--text-muted)" }}>
                  <Smartphone size={13} />
                  <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Phone Number</span>
                </div>
                <span style={{ fontSize: 13, color: "var(--text)", display: "block", marginTop: 4, fontWeight: 500 }}>{user?.phone ?? "Not set"}</span>
              </div>

              {/* Member Since & Security Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, color: "var(--text-muted)" }}>
                    <Clock size={13} />
                    <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Member Since</span>
                  </div>
                  <span style={{ fontSize: 13, color: "var(--text)", display: "block", marginTop: 4 }}>
                    {user ? new Date(user.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }) : "—"}
                  </span>
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, color: "var(--text-muted)" }}>
                    <LogIn size={13} />
                    <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Security</span>
                  </div>
                  <span style={{ fontSize: 13, color: "var(--text)", display: "block", marginTop: 4 }}>
                    {user?.is_2fa_enabled ? "2FA Enabled" : "Password Only"}
                  </span>
                </div>
              </div>

              {/* User ID & Company ID Grid (Clickable) */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div 
                  style={{ cursor: "pointer" }}
                  onClick={() => {
                    const uidToCopy = formatUserId(user);
                    if (uidToCopy) {
                      navigator.clipboard.writeText(uidToCopy);
                      triggerToast("User ID copied to clipboard!");
                    }
                  }}
                  title="Click to copy User ID"
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 5, color: "var(--text-muted)" }}>
                    <Key size={13} />
                    <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.08em" }}>User ID (Click to Copy)</span>
                  </div>
                  <span style={{ fontSize: 13, color: "var(--accent)", textDecoration: "underline", display: "block", marginTop: 4 }}>
                    {formatUserId(user)}
                  </span>
                </div>

                <div 
                  style={{ cursor: "pointer" }}
                  onClick={() => {
                    const cidToCopy = user?.company ? formatCompanyId(user.company) : (user?.company_id ? formatCompanyId(user.company_id) : null);
                    if (cidToCopy) {
                      navigator.clipboard.writeText(cidToCopy);
                      triggerToast("Company ID copied to clipboard!");
                    }
                  }}
                  title="Click to copy full Company ID"
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 5, color: "var(--text-muted)" }}>
                    <Cpu size={13} />
                    <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Company ID (Click to Copy)</span>
                  </div>
                  <span style={{ fontSize: 13, color: (user?.company || user?.company_id) ? "var(--accent)" : "var(--text)", textDecoration: (user?.company || user?.company_id) ? "underline" : "none", display: "block", marginTop: 4 }}>
                    {user?.company ? formatCompanyId(user.company) : (user?.company_id ? formatCompanyId(user.company_id) : "Not Associated")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Security & Access Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Change password */}
          <div className="source-card" style={{ padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>
                  Security Settings
                </p>
                <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>
                  Update account authentication password and security.
                </p>
              </div>
              <button className="btn btn-sm btn-primary" onClick={() => { setChangingPwd(true); setMsg(null); }}>
                <Key size={12} style={{ marginRight: 4 }} /> Change Password
              </button>
            </div>
          </div>

          {/* Danger zone / Account Control (Hidden for Super Admin & Admin) */}
          {user?.role !== "Super Admin" && user?.role !== "Admin" ? (
            <div className="source-card" style={{ padding: 20, borderColor: "rgba(229,72,77,0.15)", display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--error)", marginBottom: 4 }}>
                  Account Control
                </p>
                <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 12 }}>
                  Request permanent account deletion. Deletion will be executed automatically after 30 days. After deletion, you will be unable to access the profile.
                </p>
                
                {user?.deletion_requested_at ? (
                  <div style={{ background: "rgba(229,72,77,0.05)", border: "1px solid rgba(229,72,77,0.2)", borderRadius: 8, padding: 12, fontSize: 12 }}>
                    <p style={{ color: "var(--error)", fontWeight: 600, marginBottom: 4 }}>Deletion Requested</p>
                    <p style={{ color: "var(--text-secondary)", marginBottom: 8 }}>
                      Scheduled for deletion on: {new Date(new Date(user.deletion_requested_at).getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString("en-IN")}
                    </p>
                    <button className="btn btn-primary btn-sm" onClick={cancelDeletionRequest} disabled={loading}>
                      Cancel Deletion Request
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <textarea
                      placeholder="Please specify a reason for deactivation/deletion..."
                      className="source-input"
                      style={{ fontSize: 12, minHeight: 60, resize: "vertical", width: "100%", padding: 8 }}
                      value={deleteReason}
                      onChange={(e) => setDeleteReason(e.target.value)}
                    />
                    <button className="btn btn-danger" onClick={requestProfileDeletion} disabled={loading || !deleteReason.trim()}>
                      Request Account Deletion
                    </button>
                  </div>
                )}
              </div>

              <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}>
                <button className="btn btn-ghost w-full" onClick={onLogout} style={{ justifyContent: "center" }}>
                  Sign Out of All Devices
                </button>
              </div>
            </div>
          ) : (
            <div className="source-card" style={{ padding: 20 }}>
              <button className="btn btn-ghost w-full" onClick={onLogout} style={{ justifyContent: "center" }}>
                Sign Out of All Devices
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Login History */}
      <div className="source-card" style={{ padding: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", margin: 0 }}>
            Recent Login Activity
          </p>
          {history.length > 3 && (
            <button
              className="btn btn-sm btn-ghost"
              onClick={() => setShowLoginHistoryModal(true)}
              style={{ fontSize: 11 }}
            >
              <Clock size={12} style={{ marginRight: 4 }} /> See More ({history.length} Total Logs)
            </button>
          )}
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)", textAlign: "left", color: "var(--text-muted)", fontSize: 10, textTransform: "uppercase", fontFamily: "var(--font-mono)", letterSpacing: "0.05em" }}>
                <th style={{ padding: "8px 12px" }}>Timestamp</th>
                <th style={{ padding: "8px 12px" }}>IP Address</th>
                <th style={{ padding: "8px 12px" }}>Device</th>
                <th style={{ padding: "8px 12px" }}>Browser</th>
                <th style={{ padding: "8px 12px" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {loadingHist ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: 20, color: "var(--text-muted)" }}>Loading session logs...</td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: 20, color: "var(--text-muted)" }}>No login history available.</td>
                </tr>
              ) : (
                history.slice(0, 3).map((h, i) => (
                  <tr key={h.id || h.created_at || i} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "10px 12px", color: "var(--text)" }}>{new Date(h.created_at).toLocaleString("en-IN")}</td>
                    <td style={{ padding: "10px 12px", fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>{h.ip_address || "—"}</td>
                    <td style={{ padding: "10px 12px", color: "var(--text)" }}>{h.device || "—"}</td>
                    <td style={{ padding: "10px 12px", color: "var(--text)" }}>{h.browser || "—"}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <span className={`badge ${h.success ? "badge-online" : "badge-offline"}`}>
                        {h.success ? "Success" : "Failed"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Change Password UI Modal Popup */}
      {changingPwd && (
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
              onClick={() => { setChangingPwd(false); setMsg(null); }}
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
                Change Account Password
              </h3>
            </div>

            {msg && (
              <div style={{ color: msg.type === "ok" ? "var(--green)" : "var(--error)", fontSize: 12, background: msg.type === "ok" ? "rgba(50,205,50,0.1)" : "rgba(229,72,77,0.1)", border: `1px solid ${msg.type === "ok" ? "rgba(50,205,50,0.2)" : "rgba(229,72,77,0.2)"}`, padding: "8px 12px", borderRadius: 8 }}>
                {msg.text}
              </div>
            )}

            <form onSubmit={submitPwd} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { label: "Current Password", key: "current" as keyof typeof pwd, placeholder: "Enter current password" },
                { label: "New Password", key: "next" as keyof typeof pwd, placeholder: "Enter new password" },
                { label: "Confirm New Password", key: "confirm" as keyof typeof pwd, placeholder: "Re-enter new password" },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)", textTransform: "uppercase", display: "block", marginBottom: 4 }}>{f.label}</label>
                  <input
                    className="source-input"
                    type="password"
                    value={pwd[f.key]}
                    placeholder={f.placeholder}
                    onChange={e => setPwd(p => ({ ...p, [f.key]: e.target.value }))}
                    required
                  />
                </div>
              ))}

              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button type="button" className="btn btn-ghost" onClick={() => { setChangingPwd(false); setMsg(null); }} style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: "center" }} disabled={loading}>
                  {loading ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Profile & OTP Verification UI Modal Popup */}
      {editProfileModal && (
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
              onClick={() => { setEditProfileModal(false); setOtpError(null); setOtpStep(1); }}
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
                <Edit size={18} />
              </div>
              <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, textTransform: "uppercase", letterSpacing: "0.02em", margin: 0 }}>
                {otpStep === 1 ? "Edit Profile Details" : "OTP Verification Required"}
              </h3>
            </div>

            {otpError && (
              <div style={{ color: "var(--error)", fontSize: 12, background: "rgba(229,72,77,0.1)", border: "1px solid rgba(229,72,77,0.2)", padding: "8px 12px", borderRadius: 8 }}>
                {otpError}
              </div>
            )}

            {otpStep === 1 ? (
              <form onSubmit={handleRequestOTP} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Email Address *</label>
                  <input
                    className="source-input"
                    type="email"
                    value={newEmailInput}
                    onChange={e => setNewEmailInput(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Phone Number</label>
                  <input
                    className="source-input"
                    type="text"
                    placeholder="Enter mobile phone number"
                    value={newPhoneInput}
                    onChange={e => setNewPhoneInput(e.target.value)}
                  />
                </div>

                <div style={{ background: "rgba(0,123,255,0.05)", border: "1px solid rgba(0,123,255,0.15)", padding: "10px 12px", borderRadius: 8, fontSize: 11, color: "var(--text-muted)" }}>
                  🔒 Changing your email or mobile phone number requires OTP verification for security.
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                  <button type="button" className="btn btn-ghost" onClick={() => { setEditProfileModal(false); setOtpError(null); }} style={{ flex: 1 }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: "center" }} disabled={otpSending}>
                    {otpSending ? "Sending OTP..." : "Send Verification OTP"}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyOTP} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ background: "rgba(50,205,50,0.08)", border: "1px solid rgba(50,205,50,0.2)", padding: "10px 12px", borderRadius: 8, fontSize: 12, color: "var(--green)" }}>
                  🔑 A 6-digit verification OTP code has been dispatched to <strong>{otpTarget}</strong> via SMS / Email. Please check your phone/email and enter the code below:
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <label style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>Enter 6-Digit OTP *</label>
                    <button
                      type="button"
                      onClick={handleRequestOTP}
                      disabled={otpTimer > 0 || otpSending}
                      style={{ fontSize: 10, color: otpTimer > 0 ? "var(--text-muted)" : "var(--accent)", background: "none", border: "none", cursor: otpTimer > 0 ? "not-allowed" : "pointer", padding: 0, fontWeight: 700 }}
                    >
                      {otpTimer > 0 ? `Resend OTP in ${Math.floor(otpTimer / 60)}:${(otpTimer % 60 < 10 ? "0" : "") + (otpTimer % 60)}` : "Resend OTP"}
                    </button>
                  </div>
                  <input
                    className="source-input"
                    type="text"
                    maxLength={6}
                    placeholder="e.g. 123456"
                    value={otpInput}
                    onChange={e => setOtpInput(e.target.value)}
                    style={{ fontFamily: "var(--font-mono)", fontSize: 16, letterSpacing: 4, textAlign: "center" }}
                    required
                  />
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setOtpStep(1)} style={{ flex: 1 }}>
                    Back
                  </button>
                  <button type="submit" className="btn btn-success" style={{ flex: 1, justifyContent: "center" }} disabled={loading}>
                    {loading ? "Verify & Save Changes" : "Verify & Save Changes"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Full Login Activity History UI Modal Popup */}
      {showLoginHistoryModal && (
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
          <div className="source-card animate-slide-up" style={{ width: "100%", maxWidth: 680, maxHeight: "80vh", padding: 24, display: "flex", flexDirection: "column", gap: 16, position: "relative" }}>
            <button 
              type="button"
              onClick={() => setShowLoginHistoryModal(false)}
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
                <Clock size={18} />
              </div>
              <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, textTransform: "uppercase", letterSpacing: "0.02em", margin: 0 }}>
                Complete Login Activity Logs ({history.length})
              </h3>
            </div>

            <div style={{ overflowY: "auto", flex: 1, maxHeight: 420 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)", textAlign: "left", color: "var(--text-muted)", fontSize: 10, textTransform: "uppercase", fontFamily: "var(--font-mono)", letterSpacing: "0.05em", position: "sticky", top: 0, background: "var(--bg-soft)" }}>
                    <th style={{ padding: "8px 12px" }}>Timestamp</th>
                    <th style={{ padding: "8px 12px" }}>IP Address</th>
                    <th style={{ padding: "8px 12px" }}>Device</th>
                    <th style={{ padding: "8px 12px" }}>Browser</th>
                    <th style={{ padding: "8px 12px" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h, i) => (
                    <tr key={h.id || h.created_at || i} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "10px 12px", color: "var(--text)" }}>{new Date(h.created_at).toLocaleString("en-IN")}</td>
                      <td style={{ padding: "10px 12px", fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>{h.ip_address || "—"}</td>
                      <td style={{ padding: "10px 12px", color: "var(--text)" }}>{h.device || "—"}</td>
                      <td style={{ padding: "10px 12px", color: "var(--text)" }}>{h.browser || "—"}</td>
                      <td style={{ padding: "10px 12px" }}>
                        <span className={`badge ${h.success ? "badge-online" : "badge-offline"}`}>
                          {h.success ? "Success" : "Failed"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
              <button className="btn btn-ghost" onClick={() => setShowLoginHistoryModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

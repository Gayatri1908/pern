"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { X } from "lucide-react";

export default function SignupPage() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    company_name: "",
    company_gst_no: "",
    company_address: "",
    company_type: "",
  });
  const [codes, setCodes] = useState({ email_code: "", phone_code: "" });
  const [step, setStep] = useState(1); // 1 = Details, 2 = Verify OTP codes
  const [devCodes, setDevCodes] = useState<{ email_otp: string; phone_otp: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Google Login mock modal state
  const [showGoogleModal, setShowGoogleModal] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "light");
  }, []);

  if (isSubmitted) {
    return (
      <div data-theme="light" className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: "var(--bg)", color: "var(--text)" }}>
        <div className="w-full max-w-lg glass relative z-10 animate-slide-up" style={{ padding: 36, borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-lg)", textAlign: "center" }}>
          <div className="flex justify-center mb-4">
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(244,183,64,0.15)", border: "1px solid rgba(244,183,64,0.3)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--warning)" }}>
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <span className="badge badge-warn" style={{ marginBottom: 12 }}>Pending Verification</span>
          <h2 className="text-xl font-bold tracking-tight font-display mb-3" style={{ textTransform: "uppercase", letterSpacing: "0.04em" }}>Account Registration Submitted</h2>
          <div style={{ background: "rgba(244,183,64,0.08)", border: "1px solid rgba(244,183,64,0.2)", borderRadius: "var(--radius-sm)", padding: 18, fontSize: 13, color: "var(--text)", marginBottom: 24, textAlign: "left", lineHeight: 1.6 }}>
            Your account has been submitted for verification. Our admin team will contact you shortly for identity verification. You will receive access once your account is approved.
          </div>
          <a href="/login" className="btn btn-primary w-full" style={{ justifyContent: "center" }}>
            Return to Sign In
          </a>
        </div>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }
    setFetchingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          if (res.ok) {
            const data = await res.json();
            if (data.display_name) {
              setForm((prev) => ({ ...prev, company_address: data.display_name }));
              setFetchingLocation(false);
              return;
            }
          }
          setForm((prev) => ({
            ...prev,
            company_address: `Latitude: ${latitude.toFixed(6)}, Longitude: ${longitude.toFixed(6)}`,
          }));
        } catch (err) {
          setForm((prev) => ({
            ...prev,
            company_address: `Latitude: ${latitude.toFixed(6)}, Longitude: ${longitude.toFixed(6)}`,
          }));
        } finally {
          setFetchingLocation(false);
        }
      },
      (error) => {
        setError(`Error getting location: ${error.message}`);
        setFetchingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCodes((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRequestVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (!form.phone) {
      setError("Phone number is required for SMS authentication.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`http://${window.location.hostname}:8000/api/v1/auth/signup/request-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          phone: form.phone,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to dispatch verification codes.");
      }

      const data = await res.json();
      if (data.dev_codes) {
        setDevCodes(data.dev_codes);
      }
      setSuccess("Verification codes dispatched via Email (Gmail) and SMS (Twilio)!");
      setStep(2);
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleFinalSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    setLoading(true);
    try {
      const res = await fetch(`http://${window.location.hostname}:8000/api/v1/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          phone: form.phone,
          email_code: codes.email_code,
          phone_code: codes.phone_code,
          company_name: form.company_name || undefined,
          company_gst_no: form.company_gst_no || undefined,
          company_address: form.company_address || undefined,
          company_type: form.company_type || undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Signup failed. Double check your OTP verification codes.");
      }

      setIsSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  const triggerGoogleLogin = async (selectedEmail: string, selectedRole: string) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setShowGoogleModal(false);

    try {
      const res = await fetch(`http://${window.location.hostname}:8000/api/v1/auth/google-login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: selectedEmail,
          google_id: `g-${Date.now()}`,
          role: selectedRole
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Google login failed.");
      }

      const data = await res.json();
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      localStorage.setItem("role", data.user?.role || "Customer");
      setSuccess("Authenticated with Google! Redirecting...");
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Google Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-theme="light" className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: "#7fa8c9", color: "var(--text)" }}>
      {/* SOURCE Airships Live Background */}
      <iframe
        src="/airships_bg.html"
        title="SOURCE Airships Live Background"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          border: "none",
          zIndex: 0,
        }}
      />

      <div className="w-full max-w-lg relative z-10 animate-slide-up" style={{ padding: 32, borderRadius: "var(--radius-lg)", background: "rgba(255, 255, 255, 0.88)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", border: "1px solid rgba(255, 255, 255, 0.6)", boxShadow: "0 20px 50px rgba(0,0,0,0.25)" }}>
        <div className="flex flex-col items-center mb-6">
          <div className="flex items-center justify-center mb-4">
            <img src="/logo.png" alt="The Source Company" style={{ height: 24, width: "auto", objectFit: "contain" }} />
          </div>
          <h2 className="text-2xl font-bold tracking-tight font-display" style={{ textTransform: "uppercase", letterSpacing: "0.04em" }}>Create Account</h2>
          <p style={{ color: "var(--text-muted)", fontSize: 13, fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 2 }}>Secure Fleet Registration</p>
        </div>

        {error && (
          <div style={{ background: "rgba(229,72,77,0.1)", border: "1px solid rgba(229,72,77,0.2)", color: "var(--error)", borderRadius: "var(--radius-sm)", padding: 14, fontSize: 12, marginBottom: 20 }} className="flex items-start gap-3">
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div style={{ background: "rgba(50,205,50,0.1)", border: "1px solid rgba(50,205,50,0.2)", color: "var(--green)", borderRadius: "var(--radius-sm)", padding: 14, fontSize: 12, marginBottom: 20 }} className="flex items-start gap-3">
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span style={{ wordBreak: "break-word" }}>{success}</span>
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleRequestVerification} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Account Credentials */}
              <div className="space-y-3">
                <p style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Account Details</p>
                <div>
                  <label style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)", display: "block", marginBottom: 4 }}>Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@company.com"
                    className="source-input"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)", display: "block", marginBottom: 4 }}>Password *</label>
                    <input
                      type="password"
                      name="password"
                      required
                      value={form.password}
                      onChange={handleChange}
                      placeholder="Min. 8 chars"
                      className="source-input"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)", display: "block", marginBottom: 4 }}>Confirm Password *</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      required
                      value={form.confirmPassword}
                      onChange={handleChange}
                      placeholder="Re-enter password"
                      className="source-input"
                    />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)", display: "block", marginBottom: 4 }}>Phone Number *</label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="e.g. +919876543210"
                    className="source-input"
                  />
                </div>
              </div>

              {/* Company Info */}
              <div className="space-y-3">
                <p style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Company Information</p>
                <div>
                  <label style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)", display: "block", marginBottom: 4 }}>Company / Factory Name</label>
                  <input
                    type="text"
                    name="company_name"
                    value={form.company_name}
                    onChange={handleChange}
                    placeholder="e.g. Greenfield Industries Pvt Ltd"
                    className="source-input"
                  />
                </div>
                <div>
                  <label style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)", display: "block", marginBottom: 4 }}>Company Type</label>
                  <select
                    name="company_type"
                    value={form.company_type}
                    onChange={(e) => setForm((prev) => ({ ...prev, company_type: e.target.value }))}
                    className="source-input"
                    style={{ appearance: "auto", background: "var(--input-bg)", color: "var(--text)" }}
                  >
                    <option value="">Select Company Type</option>
                    <option value="Home">Home</option>
                    <option value="Office">Office</option>
                    <option value="Industry">Industry</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)", display: "block", marginBottom: 4 }}>GST Number (Optional)</label>
                  <input
                    type="text"
                    name="company_gst_no"
                    value={form.company_gst_no}
                    onChange={handleChange}
                    placeholder="e.g. 27AAAAA0000A1Z5"
                    className="source-input"
                  />
                </div>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <label style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>Installation Address</label>
                    <button
                      type="button"
                      onClick={handleGetLocation}
                      disabled={fetchingLocation}
                      style={{ fontSize: 10, color: "var(--accent)", border: "none", background: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, padding: 0 }}
                    >
                      <svg style={{ width: 12, height: 12 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {fetchingLocation ? "Locating..." : "Use Current Location"}
                    </button>
                  </div>
                  <input
                    type="text"
                    name="company_address"
                    value={form.company_address}
                    onChange={handleChange}
                    placeholder="e.g. MIDC Industrial Area, Pune"
                    className="source-input"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-success w-full"
              style={{ height: 42, background: "var(--green)", color: "#fff", border: "none", marginTop: 16 }}
            >
              {loading ? "Sending Codes..." : "Send Verification Codes"}
            </button>

            {/* Separator */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0" }}>
              <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
              <span style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>OR</span>
              <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            </div>

            {/* Google Signup Trigger */}
            <button
              type="button"
              onClick={() => setShowGoogleModal(true)}
              className="btn btn-ghost w-full"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, height: 42, background: "rgba(0,0,0,0.02)", border: "1px solid var(--border)" }}
            >
              <svg style={{ width: 16, height: 16 }} viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.9h6.69c-.29 1.5-.1.8-1.07 2.1l3.12 2.42c1.8-1.6 2.87-4.1 2.87-6.35z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.12-2.42c-.87.58-1.98.92-3.18.92-2.44 0-4.5-1.6-5.24-3.8H1.3l-1.3 1.02C1.96 21.8 6.64 24 12 24z"/>
                <path fill="#FBBC05" d="M6.76 15.79c-.19-.58-.3-1.2-.3-1.79s.11-1.21.3-1.79V11.2H1.3c-.63 1.25-.99 2.66-.99 4.14s.36 2.89.99 4.14l3.46-2.69z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.45-3.45C17.96 1.19 15.24 0 12 0 6.64 0 1.96 3.22 0 7.91l3.46 2.69c.74-2.2 2.8-3.85 5.24-3.85z"/>
              </svg>
              <span>Sign Up with Google</span>
            </button>

            <p style={{ textAlign: "center", fontSize: 13, color: "var(--text-muted)", paddingTop: 10 }}>
              Already have an account?{" "}
              <Link href="/login" style={{ color: "var(--accent)", fontWeight: 700, textDecoration: "none" }}>
                Sign In
              </Link>
            </p>
          </form>
        ) : (
          <form onSubmit={handleFinalSignup} className="space-y-4">
            <div>
              <p style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Enter OTP Codes</p>
              <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 16 }}>
                Verification OTP codes have been sent to <strong>{form.email}</strong> and <strong>{form.phone}</strong>.
              </p>

              {devCodes && (
                <div style={{ background: "rgba(0,123,255,0.05)", border: "1px dashed var(--border)", borderRadius: "var(--radius-sm)", padding: 12, fontSize: 11, marginBottom: 16, fontFamily: "var(--font-mono)" }}>
                  <p style={{ fontWeight: 700, color: "var(--accent)", marginBottom: 4 }}>[DEV MOCK DELIVERY CODES]</p>
                  <div>Email Code: <span style={{ fontWeight: 700, color: "var(--text)" }}>{devCodes.email_otp}</span></div>
                  <div>SMS Code: <span style={{ fontWeight: 700, color: "var(--text)" }}>{devCodes.phone_otp}</span></div>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)", display: "block", marginBottom: 4 }}>Email OTP Code *</label>
                  <input
                    type="text"
                    name="email_code"
                    required
                    value={codes.email_code}
                    onChange={handleCodeChange}
                    placeholder="Enter 6-digit code"
                    className="source-input"
                  />
                </div>
                <div>
                  <label style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)", display: "block", marginBottom: 4 }}>SMS OTP Code *</label>
                  <input
                    type="text"
                    name="phone_code"
                    required
                    value={codes.phone_code}
                    onChange={handleCodeChange}
                    placeholder="Enter 6-digit code"
                    className="source-input"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3" style={{ paddingTop: 12 }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setStep(1)}
                disabled={loading}
              >
                Go Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-success"
                style={{ background: "var(--green)", color: "#fff", border: "none" }}
              >
                {loading ? "Registering..." : "Verify & Register"}
              </button>
            </div>
          </form>
        )}

        <div style={{ marginTop: 20, textAlign: "center", borderTop: "1px solid var(--border)", paddingTop: 16 }}>
          <a 
            href={process.env.NEXT_PUBLIC_MARKETING_URL || "https://thesource-company.in"} 
            target="_blank" 
            rel="noopener noreferrer" 
            style={{ 
              fontSize: 12, 
              color: "var(--text-secondary)", 
              textDecoration: "none", 
              display: "inline-flex", 
              alignItems: "center", 
              justifyContent: "center",
              gap: 6, 
              fontWeight: 600,
              transition: "color 0.2s" 
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = "var(--accent)"}
            onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-secondary)"}
          >
            ← Back to main website
          </a>
        </div>
      </div>

      {/* ── MOCK GOOGLE LOGIN ACCOUNT SELECTION DIALOG MODAL ── */}
      {showGoogleModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
          <div className="source-card animate-slide-up" style={{ width: "90%", maxWidth: 400, padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, textTransform: "uppercase" }}>Sign in with Google</h3>
              <button className="btn btn-ghost btn-xs" onClick={() => setShowGoogleModal(false)}><X size={14} /></button>
            </div>
            <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>Select a mocked Google account to authenticate with the dashboard instantly:</p>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button
                className="btn btn-ghost"
                style={{ justifyContent: "flex-start", width: "100%", padding: 12 }}
                onClick={() => triggerGoogleLogin("admin@example.com", "Admin")}
              >
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>System Administrator</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>admin@example.com</div>
                </div>
              </button>
              
              <button
                className="btn btn-ghost"
                style={{ justifyContent: "flex-start", width: "100%", padding: 12 }}
                onClick={() => triggerGoogleLogin("customer@example.com", "Customer")}
              >
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>Standard Customer</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>customer@example.com</div>
                </div>
              </button>

              <div style={{ borderTop: "1px solid var(--border)", paddingTop: 10 }}>
                <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 6, fontFamily: "var(--font-mono)" }}>OR ENTER CUSTOM EMAIL</div>
                <input
                  type="email"
                  placeholder="yourname@gmail.com"
                  className="source-input"
                  style={{ marginBottom: 10 }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      triggerGoogleLogin((e.target as HTMLInputElement).value, "Customer");
                    }
                  }}
                />
                <button
                  className="btn btn-primary btn-sm w-full"
                  onClick={(e) => {
                    const inp = e.currentTarget.previousElementSibling as HTMLInputElement;
                    if (inp && inp.value) {
                      triggerGoogleLogin(inp.value, "Customer");
                    }
                  }}
                >
                  Continue with Custom Google Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { X, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Forgot password flow states
  const [showPassword, setShowPassword] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showResetForm, setShowResetForm] = useState(false);
  const [generatedDebugToken, setGeneratedDebugToken] = useState("");
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

  // Google Login mock modal state
  const [showGoogleModal, setShowGoogleModal] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "light");
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`http://${window.location.hostname}:8000/api/v1/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Authentication failed");
      }

      const data = await res.json();

      if (data.requires_2fa) {
        setTempToken(data.temp_token);
        setSuccess("OTP sent to your email. Please enter the 6-digit code.");
      } else {
        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("refresh_token", data.refresh_token);
        localStorage.setItem("role", data.user?.role || "Customer");
        setSuccess("Login successful! Redirecting...");
        setTimeout(() => {
          window.location.href = "/";
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`http://${window.location.hostname}:8000/api/v1/auth/verify-2fa`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          temp_token: tempToken,
          code,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Invalid or expired OTP");
      }

      const data = await res.json();
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      localStorage.setItem("role", data.user?.role || "Customer");
      setSuccess("2FA verified successfully! Redirecting...");
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    } catch (err: any) {
      setError(err.message || "2FA verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`http://${window.location.hostname}:8000/api/v1/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to submit request.");
      }

      const data = await res.json();
      if (data.debug_token) {
        setGeneratedDebugToken(data.debug_token);
        setSuccess(`Reset code generated: ${data.debug_token}. Copy this to reset your password.`);
      } else {
        setSuccess("Reset request submitted.");
      }
      setShowResetForm(true);
      setOtpTimer(180);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`http://${window.location.hostname}:8000/api/v1/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          token: resetToken,
          new_password: newPassword
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Reset failed. Verify your code.");
      }

      setSuccess("Password reset successfully! You can now log in.");
      setTimeout(() => {
        setForgotMode(false);
        setShowResetForm(false);
        setResetToken("");
        setNewPassword("");
        setSuccess(null);
      }, 2000);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    if (typeof window !== "undefined" && (window as any).google?.accounts?.id) {
      const google = (window as any).google;
      google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "824872892236-8ghplngu651h8f2vjmeu6r64r39c1up2.apps.googleusercontent.com",
        callback: async (response: any) => {
          if (response.credential) {
            setLoading(true);
            setError(null);
            try {
              const res = await fetch(`http://${window.location.hostname}:8000/api/v1/auth/google-login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ credential: response.credential }),
              });

              if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.detail || "Google authentication failed.");
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
          }
        },
      });
      google.accounts.id.prompt();
    } else {
      setError("Google Sign-In is loading. Please try again in a moment.");
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

      <div className="w-full max-w-md relative z-10" style={{ padding: 36, borderRadius: 24, background: "rgba(255, 255, 255, 0.45)", backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)", border: "1px solid rgba(255, 255, 255, 0.65)", boxShadow: "0 20px 50px rgba(0,0,0,0.15), inset 0 1px 1px rgba(255, 255, 255, 0.8)" }}>
        <div className="flex flex-col items-center mb-6">
          <div className="flex items-center justify-center mb-3">
            <img src="/logo.png" alt="The Source Company" style={{ height: 60, width: "auto", maxWidth: 240, objectFit: "contain", filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.1))" }} />
          </div>
          <p style={{ color: "#1e293b", fontSize: 13, fontWeight: 700, fontFamily: "var(--font-display)", letterSpacing: "0.02em", textAlign: "center", margin: 0 }}>
            Build your Energy Assets Today
          </p>
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

        {/* ── FORGOT PASSWORD MODE ── */}
        {forgotMode ? (
          showResetForm ? (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: 12 }}>Recover Password</h3>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <label style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>Reset Token Code</label>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={otpTimer > 0 || loading}
                    style={{ fontSize: 10, color: otpTimer > 0 ? "var(--text-muted)" : "var(--accent)", background: "none", border: "none", cursor: otpTimer > 0 ? "not-allowed" : "pointer", padding: 0, fontWeight: 700 }}
                  >
                    {otpTimer > 0 ? `Resend Code in ${Math.floor(otpTimer / 60)}:${(otpTimer % 60 < 10 ? "0" : "") + (otpTimer % 60)}` : "Resend Code"}
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  placeholder="RESET-XXXXXX"
                  className="source-input"
                />
              </div>
              <div>
                <label style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)", textTransform: "uppercase", display: "block", marginBottom: 6 }}>New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="source-input"
                />
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setForgotMode(false)}>Cancel</button>
                <button type="submit" disabled={loading} className="btn btn-primary" style={{ flex: 1 }}>{loading ? "Resetting..." : "Reset Password"}</button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-5">
              <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: 12 }}>Forgot Password</h3>
              <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>Enter your registered email below to receive a password recovery verification token code.</p>
              <div>
                <label style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="source-input"
                />
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setForgotMode(false)}>Back</button>
                <button type="submit" disabled={loading} className="btn btn-primary" style={{ flex: 1 }}>{loading ? "Submitting..." : "Send Reset Code"}</button>
              </div>
            </form>
          )
        ) : !tempToken ? (
          /* ── STANDARD LOGIN FORM ── */
          <div className="space-y-5">
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label style={{ fontSize: 10, color: "#334155", fontWeight: 700, fontFamily: "var(--font-mono)", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="source-input"
                  style={{ background: "rgba(255, 255, 255, 0.6)", backdropFilter: "blur(8px)", border: "1px solid rgba(255, 255, 255, 0.8)", color: "#0f172a" }}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label style={{ fontSize: 10, color: "#334155", fontWeight: 700, fontFamily: "var(--font-mono)", textTransform: "uppercase", display: "block" }}>Password</label>
                  <button type="button" onClick={() => setForgotMode(true)} style={{ fontSize: 10, color: "var(--accent)", background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 700 }}>Forgot Password?</button>
                </div>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="source-input"
                    style={{ background: "rgba(255, 255, 255, 0.6)", backdropFilter: "blur(8px)", border: "1px solid rgba(255, 255, 255, 0.8)", color: "#0f172a", paddingRight: 40 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#64748b",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 4
                    }}
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full"
                style={{ height: 44, borderRadius: 12, fontWeight: 700, fontSize: 14, letterSpacing: "0.04em", boxShadow: "0 8px 20px rgba(0,123,255,0.3)" }}
              >
                {loading ? "Authenticating..." : "Sign In"}
              </button>
            </form>

            {/* Separator */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0" }}>
              <div style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.1)" }} />
              <span style={{ fontSize: 10, color: "#64748b", fontFamily: "var(--font-mono)", fontWeight: 700 }}>OR</span>
              <div style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.1)" }} />
            </div>

            {/* Google Login Trigger */}
            <button
              onClick={handleGoogleSignIn}
              className="btn btn-ghost w-full"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, height: 44, background: "rgba(255, 255, 255, 0.55)", backdropFilter: "blur(8px)", border: "1px solid rgba(255, 255, 255, 0.8)", color: "#0f172a", borderRadius: 12, fontWeight: 600 }}
            >
              <svg style={{ width: 16, height: 16 }} viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.9h6.69c-.29 1.5-.1.8-1.07 2.1l3.12 2.42c1.8-1.6 2.87-4.1 2.87-6.35z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.12-2.42c-.87.58-1.98.92-3.18.92-2.44 0-4.5-1.6-5.24-3.8H1.3l-1.3 1.02C1.96 21.8 6.64 24 12 24z"/>
                <path fill="#FBBC05" d="M6.76 15.79c-.19-.58-.3-1.2-.3-1.79s.11-1.21.3-1.79V11.2H1.3c-.63 1.25-.99 2.66-.99 4.14s.36 2.89.99 4.14l3.46-2.69z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.45-3.45C17.96 1.19 15.24 0 12 0 6.64 0 1.96 3.22 0 7.91l3.46 2.69c.74-2.2 2.8-3.85 5.24-3.85z"/>
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>
        ) : (
          /* ── 2FA VERIFICATION CODE FORM ── */
          <form onSubmit={handleVerify2FA} className="space-y-5">
            <div>
              <label style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Verification Code</label>
              <input
                type="text"
                required
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                className="source-input"
                style={{ letterSpacing: "0.2em", textAlign: "center", fontSize: 18 }}
              />
              <p style={{ color: "var(--text-muted)", fontSize: 11, marginTop: 8, textAlign: "center" }}>
                Enter the 6-digit confirmation code generated by your Authenticator app.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full"
              style={{ height: 42 }}
            >
              {loading ? "Verifying..." : "Verify Code"}
            </button>

            <button
              type="button"
              onClick={() => setTempToken(null)}
              className="btn btn-ghost w-full"
              style={{ height: 40 }}
            >
              Back to Login
            </button>
          </form>
        )}

        <p style={{ marginTop: 24, fontSize: 13, color: "var(--text-muted)", textAlign: "center" }}>
          Don&apos;t have an account?{" "}
          <a href="/signup" style={{ color: "var(--accent)", fontWeight: 700, textDecoration: "none" }}>
            Sign Up
          </a>
        </p>

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
    </div>
  );
}

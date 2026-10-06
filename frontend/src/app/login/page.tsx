"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield, Lock, Mail, Eye, EyeOff, UserCheck, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { api, getStoredUser, getToken } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // If already logged in, redirect to main portal
  useEffect(() => {
    if (getToken() && getStoredUser()) {
      router.replace("/");
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await api.auth.login({ email, password });
      if (res && res.token) {
        setSuccess(`Welcome back, ${res.user.name} (${res.user.role})! Redirecting...`);
        setTimeout(() => {
          router.replace("/");
        }, 800);
      } else {
        throw new Error("Invalid response from authentication server");
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (role: "ADMIN" | "SALES_USER") => {
    if (role === "ADMIN") {
      setEmail("admin@thesource.com");
      setPassword("Admin@123");
    } else {
      setEmail("sales@thesource.com");
      setPassword("Sales@123");
    }
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background ambient gradient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-blue-600/10 blur-[130px] pointer-events-none rounded-full" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-emerald-600/5 blur-[120px] pointer-events-none rounded-full" />

      {/* Main card */}
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-xl p-8 relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-blue-600/15 border border-blue-500/30 text-blue-400 mb-4 shadow-inner">
            <Shield className="w-7 h-7 text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            The Source Company
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Commercial Workflow & Inventory Management
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800/80 border border-slate-700/60 text-slate-300">
            <span>PERN Case Study Application</span>
          </div>
        </div>

        {/* Feedback alerts */}
        {error && (
          <div className="mb-6 p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@thesource.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-10 py-2.5 bg-slate-950/60 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg font-medium text-sm transition shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Signing in...
              </span>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick-Fill Role Credentials */}
        <div className="mt-8 pt-6 border-t border-slate-800/80">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 text-center">
            Case Study Demo Credentials
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => handleQuickFill("ADMIN")}
              className="p-2.5 rounded-lg border border-slate-800 bg-slate-950/40 hover:bg-slate-800 hover:border-slate-700 transition text-left group"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-blue-400 group-hover:text-blue-300">ADMIN</span>
                <UserCheck className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <p className="text-[11px] text-slate-400 truncate">admin@thesource.com</p>
              <p className="text-[10px] text-slate-500">Confirm Orders & Dispatch</p>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill("SALES_USER")}
              className="p-2.5 rounded-lg border border-slate-800 bg-slate-950/40 hover:bg-slate-800 hover:border-slate-700 transition text-left group"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-emerald-400 group-hover:text-emerald-300">SALES USER</span>
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <p className="text-[11px] text-slate-400 truncate">sales@thesource.com</p>
              <p className="text-[10px] text-slate-500">Enquiries & Quotations</p>
            </button>
          </div>
        </div>

        {/* Workflow reminder */}
        <div className="mt-6 text-center text-xs text-slate-500">
          <p>Workflow: Enquiry → Quotation → Sales Order → Dispatch</p>
        </div>
      </div>
    </div>
  );
}

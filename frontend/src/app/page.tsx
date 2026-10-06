"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Calculator,
  ShoppingBag,
  PackageCheck,
  LogOut,
  Shield,
  User as UserIcon,
  ChevronRight,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { clearTokens, getStoredUser, getToken, api } from "@/lib/api";
import type { User } from "@/types";
import { EnquiriesView } from "@/components/caseStudy/EnquiriesView";
import { QuotationsView } from "@/components/caseStudy/QuotationsView";
import { SalesOrdersView } from "@/components/caseStudy/SalesOrdersView";
import { InventoryView } from "@/components/caseStudy/InventoryView";

type ActiveTab = "enquiries" | "quotations" | "orders" | "inventory";

export default function CaseStudyPortal() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>("enquiries");

  // Flow navigation state across tabs
  const [selectedEnquiryForQuote, setSelectedEnquiryForQuote] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    const storedUser = getStoredUser();

    if (!token || !storedUser) {
      router.replace("/login");
      return;
    }

    setUser(storedUser);
    setLoading(false);

    // Verify token validity with backend
    api.auth.me().then((res) => {
      if (res && res.user) {
        setUser(res.user);
      }
    }).catch(() => {
      // If token expired, clear and redirect to login
      clearTokens();
      router.replace("/login");
    });
  }, [router]);

  const handleLogout = () => {
    clearTokens();
    router.replace("/login");
  };

  const navigateToCreateQuotation = (enquiryId: string) => {
    setSelectedEnquiryForQuote(enquiryId);
    setActiveTab("quotations");
  };

  const navigateToViewOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
    setActiveTab("orders");
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300">
        <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium">Loading PERN Case Study Portal...</p>
      </div>
    );
  }

  const isAdmin = user.role === "ADMIN" || user.role === "Super Admin";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* ── Top Header Navigation ─────────────────────────────────── */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center font-black text-white shadow-md shadow-blue-500/20">
              S
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-white tracking-tight">The Source Company</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800/80">
                  PERN Workflow
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Order & Stock Management Case Study</p>
            </div>
          </div>

          {/* Core Workflow Tab Links */}
          <nav className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800/80">
            <button
              id="tab-enquiries"
              onClick={() => {
                setSelectedEnquiryForQuote(null);
                setActiveTab("enquiries");
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
                activeTab === "enquiries"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>1. Enquiries</span>
            </button>

            <button
              id="tab-quotations"
              onClick={() => setActiveTab("quotations")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
                activeTab === "quotations"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>2. Quotations</span>
            </button>

            <button
              id="tab-orders"
              onClick={() => setActiveTab("orders")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
                activeTab === "orders"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>3. Sales Orders</span>
            </button>

            <button
              id="tab-inventory"
              onClick={() => setActiveTab("inventory")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
                activeTab === "inventory"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <PackageCheck className="w-3.5 h-3.5" />
              <span>Inventory</span>
            </button>
          </nav>

          {/* User profile & RBAC & Logout */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-medium text-slate-200">{user.name}</div>
              <div className="flex items-center justify-end gap-1.5">
                <span
                  className={`inline-block w-1.5 h-1.5 rounded-full ${
                    isAdmin ? "bg-blue-400" : "bg-emerald-400"
                  }`}
                />
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider ${
                    isAdmin ? "text-blue-400" : "text-emerald-400"
                  }`}
                >
                  {user.role}
                </span>
              </div>
            </div>

            <button
              id="btn-logout"
              onClick={handleLogout}
              title="Sign Out"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Workflow Pipeline Bar ─────────────────────────────────── */}
      <div className="bg-slate-900/40 border-b border-slate-800/60 py-2.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-slate-400 overflow-x-auto whitespace-nowrap gap-4">
          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="font-semibold text-slate-300">Commercial Pipeline:</span>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded font-medium ${activeTab === 'enquiries' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' : 'text-slate-400'}`}>
              1. Customer Enquiry
            </span>
            <ChevronRight className="w-3 h-3 text-slate-600" />
            <span className={`px-2 py-0.5 rounded font-medium ${activeTab === 'quotations' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' : 'text-slate-400'}`}>
              2. Quotation (Discount & GST)
            </span>
            <ChevronRight className="w-3 h-3 text-slate-600" />
            <span className="px-2 py-0.5 rounded font-medium text-emerald-400 bg-emerald-950/40 border border-emerald-800/50">
              3. Acceptance
            </span>
            <ChevronRight className="w-3 h-3 text-slate-600" />
            <span className={`px-2 py-0.5 rounded font-medium ${activeTab === 'orders' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' : 'text-slate-400'}`}>
              4. Sales Order (Stock Reservation)
            </span>
            <ChevronRight className="w-3 h-3 text-slate-600" />
            <span className="px-2 py-0.5 rounded font-medium text-purple-400 bg-purple-950/40 border border-purple-800/50">
              5. Dispatch & Stock Deduction
            </span>
          </div>

          <div className="text-[11px] text-slate-500 font-mono hidden md:block">
            Avail = Physical − Reserved
          </div>
        </div>
      </div>

      {/* ── Main View Content Area ────────────────────────────────── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === "enquiries" && (
          <EnquiriesView
            user={user}
            onNavigateToQuotationCreate={navigateToCreateQuotation}
          />
        )}

        {activeTab === "quotations" && (
          <QuotationsView
            user={user}
            initialEnquiryId={selectedEnquiryForQuote}
            onNavigateToOrder={navigateToViewOrder}
          />
        )}

        {activeTab === "orders" && (
          <SalesOrdersView
            user={user}
            initialOrderId={selectedOrderId}
          />
        )}

        {activeTab === "inventory" && (
          <InventoryView
            user={user}
          />
        )}
      </main>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 px-6 text-center text-xs text-slate-600">
        <p>PERN Technical Case Study — PostgreSQL • Express • React / Next.js • Node.js</p>
      </footer>
    </div>
  );
}

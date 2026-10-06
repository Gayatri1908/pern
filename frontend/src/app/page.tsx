"use client";
// ============================================================
// The Source Company — Energy Operations & Mission Control
// Orchestrates all 10 industrial airborne wind energy panels
// ============================================================

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, X } from "lucide-react";
import { Sidebar, type TabId } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { MissionControlPanel } from "@/components/energy/MissionControlPanel";
import { EnergySystemsPanel } from "@/components/energy/EnergySystemsPanel";
import { EnergySystemDetailModal } from "@/components/energy/EnergySystemDetailModal";
import { LiveMonitoringPanel } from "@/components/energy/LiveMonitoringPanel";
import { TelemetryExplorerPanel } from "@/components/energy/TelemetryExplorerPanel";
import { SystemHealthPanel } from "@/components/energy/SystemHealthPanel";
import { AlertsEventsPanel } from "@/components/energy/AlertsEventsPanel";
import { EnergyAnalyticsPanel } from "@/components/energy/EnergyAnalyticsPanel";
import { ComponentsAssetsPanel } from "@/components/energy/ComponentsAssetsPanel";
import { MaintenanceOperationsPanel } from "@/components/energy/MaintenanceOperationsPanel";
import { AdministrationPanel } from "@/components/energy/AdministrationPanel";
import { ProfilePanel } from "@/components/dashboard/ProfilePanel";
import { api, clearTokens, getToken } from "@/lib/api";
import type { EnergySystem, User as UserType, UserRole } from "@/types";

// ── Tab metadata for Topbar ──────────────────────────────────
const TAB_META: Record<TabId, { title: string; subtitle: string }> = {
  mission_control: { title: "Mission Control", subtitle: "Fleet overview & real-time operational indicators" },
  systems:         { title: "Energy Systems", subtitle: "Manage and inspect deployed airborne wind turbine systems" },
  monitoring:      { title: "Live Monitoring", subtitle: "Continuous high-frequency telemetry cockpit & gauges" },
  telemetry:       { title: "Telemetry Explorer", subtitle: "Multi-metric historical time series & sensor logs" },
  health:          { title: "System Health", subtitle: "Hierarchical System → Subsystem → Component diagnostics" },
  alerts:          { title: "Alerts & Events", subtitle: "Active threshold breaches, acknowledgements & audit trail" },
  analytics:       { title: "Energy Analytics", subtitle: "Renewable energy yields, capacity factor & generation trends" },
  components:      { title: "Hardware Assets", subtitle: "Traceable component registry & operational lifecycle" },
  maintenance:     { title: "Maintenance Operations", subtitle: "Work order management, preventative & corrective protocols" },
  admin:           { title: "Administration", subtitle: "User provisioning, operating envelopes & system audit logs" },
  dashboard:       { title: "Mission Control", subtitle: "Fleet overview & real-time operational indicators" },
  products:        { title: "Energy Systems", subtitle: "Manage and inspect deployed airborne wind turbine systems" },
  profile:         { title: "My Profile", subtitle: "Account and security settings" },
};

export default function DashboardPage() {
  const router = useRouter();

  // ── Auth ──────────────────────────────────────────────────
  const [user, setUser] = useState<UserType | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // ── UI State ──────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<TabId>("mission_control");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [globalSuccess, setGlobalSuccess] = useState<string | null>(null);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  // ── System Modal State ────────────────────────────────────
  const [selectedSystem, setSelectedSystem] = useState<EnergySystem | null>(null);
  const [activeAlertCount, setActiveAlertCount] = useState(0);

  // ── Load alert counter ────────────────────────────────────
  const loadAlertCounter = useCallback(async () => {
    try {
      const res = await api.alerts.list({ status: "ACTIVE" });
      if (res && Array.isArray(res.data)) {
        setActiveAlertCount(res.data.length);
      }
    } catch {
      // ignore
    }
  }, []);

  // ── Init & Hash Routing ───────────────────────────────────
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "dark" | "light" | null;
    if (savedTheme) setTheme(savedTheme);

    const handleHashChange = () => {
      const rawHash = window.location.hash.replace("#", "") as TabId;
      if (rawHash && TAB_META[rawHash]) {
        setActiveTab(rawHash);
      }
    };

    const rawHash = window.location.hash.replace("#", "") as TabId;
    if (rawHash && TAB_META[rawHash]) {
      setActiveTab(rawHash);
    } else {
      const savedTab = localStorage.getItem("activeTab") as TabId | null;
      if (savedTab && TAB_META[savedTab]) {
        setActiveTab(savedTab);
      }
    }

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("activeTab", activeTab);
    if (window.location.hash.replace("#", "") !== activeTab) {
      window.history.pushState(null, "", `#${activeTab}`);
    }
  }, [activeTab]);

  // ── Auth: verify on mount ─────────────────────────────────
  useEffect(() => {
    const storedToken = getToken();
    if (!storedToken) {
      router.push("/login");
      return;
    }
    api.auth.me().then((u: unknown) => {
      const userData = u as UserType;
      setUser(userData);
      setRole(userData.role as UserRole);
      setAuthLoading(false);
      loadAlertCounter();
    }).catch(() => {
      clearTokens();
      router.push("/login");
    });
  }, [router, loadAlertCounter]);

  // ── Periodic alert refresh ────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      loadAlertCounter();
    }, 15000);
    return () => clearInterval(interval);
  }, [loadAlertCounter]);

  // ── Refresh all data ──────────────────────────────────────
  async function refreshAll() {
    setRefreshing(true);
    await loadAlertCounter();
    setRefreshing(false);
    showSuccess("Platform data refreshed.");
  }

  // ── Logout ────────────────────────────────────────────────
  function logout() {
    clearTokens();
    router.push("/login");
  }

  // ── Notifications ─────────────────────────────────────────
  function showSuccess(msg: string) {
    setGlobalSuccess(msg);
    setTimeout(() => setGlobalSuccess(null), 4000);
  }

  // ── Auth Guard ────────────────────────────────────────────
  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
        <div style={{ width: 40, height: 40, border: "3px solid var(--border)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-muted)" }}>Authenticating industrial platform session...</p>
      </div>
    );
  }

  const meta = TAB_META[activeTab] || TAB_META.mission_control;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setSelectedSystem(null);
        }}
        role={role ?? "Customer"}
        alertCount={activeAlertCount}
        onLogout={logout}
        isCollapsed={sidebarCollapsed}
      />

      {/* Main Content Area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Topbar */}
        <Topbar
          user={user}
          onMenuToggle={() => setSidebarCollapsed(v => !v)}
          onRefresh={refreshAll}
          isRefreshing={refreshing}
          title={meta.title}
          subtitle={meta.subtitle}
          theme={theme}
          onThemeToggle={() => setTheme(t => t === "dark" ? "light" : "dark")}
          onNavigateTab={(tab) => {
            setActiveTab(tab as TabId);
            setSelectedSystem(null);
          }}
          onLogout={logout}
        />

        {/* Global Banner Messages */}
        {(globalError || globalSuccess) && (
          <div style={{
            margin: "12px 24px 0",
            background: globalError ? "rgba(229,72,77,0.1)" : "rgba(34,197,94,0.1)",
            border: `1px solid ${globalError ? "rgba(229,72,77,0.3)" : "rgba(34,197,94,0.3)"}`,
            borderRadius: 8, padding: "10px 16px",
            color: globalError ? "var(--error)" : "var(--green)", fontSize: 12,
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <span>{globalError ?? globalSuccess}</span>
            <button
              onClick={() => { setGlobalError(null); setGlobalSuccess(null); }}
              style={{ background: "none", border: "none", cursor: "pointer", color: "inherit" }}
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Deactivation / Deletion Warning Banner */}
        {user?.deletion_requested_at && (
          <div style={{
            margin: "12px 24px 0",
            background: "rgba(229,72,77,0.1)",
            border: "1px solid rgba(229,72,77,0.3)",
            borderRadius: 8, padding: "12px 18px",
            color: "var(--error)", fontSize: 13,
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <AlertTriangle size={16} />
              <span>
                <strong>Account Deletion Scheduled:</strong> Profile removal pending. Access terminates in 30 days.
              </span>
            </div>
            <button 
              onClick={() => setActiveTab("profile")} 
              className="btn btn-sm btn-primary"
              style={{ padding: "4px 10px", fontSize: 11 }}
            >
              Manage
            </button>
          </div>
        )}

        {/* Dedicated Operational Panels */}
        <main style={{ flex: 1, padding: "24px", overflowY: "auto" }}>
          {(activeTab === "mission_control" || activeTab === "dashboard") && (
            <MissionControlPanel
              onNavigateTab={(tab) => setActiveTab(tab as TabId)}
              onSelectSystem={(sys) => setSelectedSystem(sys)}
            />
          )}

          {(activeTab === "systems" || activeTab === "products") && (
            <EnergySystemsPanel
              onSelectSystem={(sys) => setSelectedSystem(sys)}
            />
          )}

          {activeTab === "monitoring" && (
            <LiveMonitoringPanel />
          )}

          {activeTab === "telemetry" && (
            <TelemetryExplorerPanel />
          )}

          {activeTab === "health" && (
            <SystemHealthPanel />
          )}

          {activeTab === "alerts" && (
            <AlertsEventsPanel />
          )}

          {activeTab === "analytics" && (
            <EnergyAnalyticsPanel />
          )}

          {activeTab === "components" && (
            <ComponentsAssetsPanel />
          )}

          {activeTab === "maintenance" && (
            <MaintenanceOperationsPanel />
          )}

          {activeTab === "admin" && (
            <AdministrationPanel />
          )}

          {activeTab === "profile" && (
            <ProfilePanel user={user} onLogout={logout} onUpdate={setUser} />
          )}
        </main>
      </div>

      {/* Energy System Cockpit Inspection Modal */}
      {selectedSystem && (
        <EnergySystemDetailModal
          system={selectedSystem}
          onClose={() => setSelectedSystem(null)}
        />
      )}
    </div>
  );
}

"use client";
// ============================================================
// Sidebar — main navigation for admin/customer dashboard
// ============================================================
import React from "react";
import {
  LayoutDashboard, Cpu, BarChart3, AlertTriangle, FileText,
  Wrench, Map, Users, History, Bell, Settings, User,
  LogOut, ShieldAlert, Activity, ClipboardList
} from "lucide-react";
import type { UserRole } from "@/types";

export type TabId =
  | "mission_control"
  | "systems"
  | "monitoring"
  | "telemetry"
  | "health"
  | "alerts"
  | "analytics"
  | "components"
  | "maintenance"
  | "admin"
  | "dashboard"
  | "products"
  | "profile";

interface NavItem {
  id: TabId;
  label: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
  operatorOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { id: "mission_control", label: "Mission Control",      icon: <LayoutDashboard size={14} /> },
  { id: "systems",         label: "Energy Systems",       icon: <Cpu size={14} /> },
  { id: "monitoring",      label: "Live Monitoring",      icon: <Activity size={14} /> },
  { id: "telemetry",       label: "Telemetry",            icon: <Activity size={14} /> },
  { id: "health",          label: "System Health",        icon: <ShieldAlert size={14} /> },
  { id: "alerts",          label: "Alerts & Events",      icon: <AlertTriangle size={14} /> },
  { id: "analytics",       label: "Energy Analytics",     icon: <BarChart3 size={14} /> },
  { id: "components",      label: "Hardware Assets",      icon: <Cpu size={14} /> },
  { id: "maintenance",     label: "Maintenance",         icon: <Wrench size={14} /> },
  { id: "admin",           label: "Administration",       icon: <Settings size={14} />, adminOnly: true },
  { id: "profile",         label: "My Profile",           icon: <User size={14} /> },
];

interface SidebarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  role: UserRole;
  alertCount?: number;
  pendingApprovalCount?: number;
  onLogout: () => void;
  isCollapsed?: boolean;
}

export function Sidebar({ activeTab, onTabChange, role, alertCount = 0, pendingApprovalCount = 0, onLogout, isCollapsed }: SidebarProps) {
  const visible = NAV_ITEMS.filter(item => {
    if (item.adminOnly && role !== "Admin" && role !== "Super Admin") return false;
    return true;
  });

  const width = isCollapsed ? 56 : 240;

  return (
    <aside style={{
      width, minWidth: width,
      background: "var(--bg-soft)",
      borderRight: "1px solid var(--border)",
      display: "flex",
      flexDirection: "column",
      height: "100vh",
      position: "sticky",
      top: 0,
      transition: "width 220ms var(--ease-soft), min-width 220ms var(--ease-soft)",
      overflow: "hidden",
      zIndex: 40,
    }}>
      {/* Logo */}
      <div style={{
        height: "var(--header-h)",
        display: "flex",
        alignItems: "center",
        justifyContent: isCollapsed ? "center" : "flex-start",
        padding: isCollapsed ? "0" : "0 20px",
        borderBottom: "1px solid var(--border)",
        gap: 10,
        flexShrink: 0,
        transition: "padding 220ms var(--ease-soft), justify-content 220ms var(--ease-soft)",
      }}>
        <img 
          className="sidebar-logo"
          src="/logo.png" 
          alt="The Source Company" 
          style={{ 
            height: isCollapsed ? 32 : 44, 
            width: "auto", 
            maxWidth: "100%",
            objectFit: "contain",
            flexShrink: 0,
            transition: "all 220ms var(--ease-soft)"
          }} 
        />
      </div>

      {/* Role badge */}
      <div style={{ 
        padding: isCollapsed ? "0 16px" : "12px 16px 8px", 
        opacity: isCollapsed ? 0 : 1,
        height: isCollapsed ? 0 : 44,
        overflow: "hidden",
        transition: "all 220ms var(--ease-soft)",
        whiteSpace: "nowrap"
      }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "4px 10px", borderRadius: 9999,
          background: role === "Admin" ? "rgba(0,123,255,0.1)" : "rgba(50,205,50,0.08)",
          border: `1px solid ${role === "Admin" ? "rgba(0,123,255,0.2)" : "rgba(50,205,50,0.15)"}`,
        }}>
          <ShieldAlert size={10} color={role === "Admin" ? "var(--accent)" : "var(--green)"} />
          <span style={{
            fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
            fontFamily: "var(--font-mono)",
            color: role === "Admin" ? "var(--accent)" : "var(--green)",
          }}>
            {role}
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "8px 10px" }}>
        {visible.map(item => {
          const isActive = activeTab === item.id;
          const showBadge = item.id === "alerts" && alertCount > 0;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`nav-item${isActive ? " active" : ""}`}
              style={{ marginBottom: 2, justifyContent: isCollapsed ? "center" : "flex-start", padding: isCollapsed ? "9px 0" : "9px 14px" }}
              title={isCollapsed ? item.label : undefined}
            >
              <span style={{ flexShrink: 0 }}>{item.icon}</span>
              <span style={{ 
                flex: 1, 
                whiteSpace: "nowrap", 
                opacity: isCollapsed ? 0 : 1,
                width: isCollapsed ? 0 : "auto",
                overflow: "hidden",
                transition: "opacity 220ms var(--ease-soft)" 
              }}>
                {item.label}
              </span>
              {showBadge && (
                <span style={{
                  background: "var(--error)",
                  color: "#fff",
                  borderRadius: 9999,
                  fontSize: 9,
                  fontWeight: 700,
                  padding: "1px 6px",
                  fontFamily: "var(--font-mono)",
                  opacity: isCollapsed ? 0 : 1,
                  transition: "opacity 220ms var(--ease-soft)"
                }}>
                  {alertCount > 99 ? "99+" : alertCount}
                </span>
              )}
              {item.id === "admin" && pendingApprovalCount > 0 && (
                <span style={{
                  background: "var(--warning)",
                  color: "#000",
                  borderRadius: 9999,
                  fontSize: 9,
                  fontWeight: 700,
                  padding: "1px 6px",
                  fontFamily: "var(--font-mono)",
                  opacity: isCollapsed ? 0 : 1,
                  transition: "opacity 220ms var(--ease-soft)"
                }}>
                  {pendingApprovalCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div style={{ padding: "10px", borderTop: "1px solid var(--border)", whiteSpace: "nowrap" }}>
        <button
          onClick={onLogout}
          className="nav-item"
          style={{ color: "var(--error)", justifyContent: isCollapsed ? "center" : "flex-start", padding: isCollapsed ? "9px 0" : "9px 14px" }}
          title={isCollapsed ? "Log Out" : undefined}
        >
          <LogOut size={14} style={{ flexShrink: 0 }} />
          <span style={{ 
            opacity: isCollapsed ? 0 : 1,
            width: isCollapsed ? 0 : "auto",
            overflow: "hidden",
            transition: "opacity 220ms var(--ease-soft)"
          }}>
            Log Out
          </span>
        </button>
      </div>
    </aside>
  );
}

import React, { useState, useRef, useEffect } from "react";
import { Search, Menu, RefreshCw, Sun, Moon, User as UserIcon, Settings, LogOut, Clock } from "lucide-react";
import type { User } from "@/types";
import { formatUserId } from "@/lib/idGenerator";

interface TopbarProps {
  user: User | null;
  onMenuToggle?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  title: string;
  subtitle?: string;
  theme?: "dark" | "light";
  onThemeToggle?: () => void;
  onNavigateTab?: (tab: string) => void;
  onLogout?: () => void;
}

const SEARCH_TARGETS = [
  { id: "mission_control", title: "Mission Control Overview", category: "Fleet", tab: "mission_control", description: "Fleet KPIs, active generation, telemetry & operational events" },
  { id: "systems", title: "Airborne Wind Energy Systems", category: "Fleet", tab: "systems", description: "Fleet inventory, models, ratings, status & operational details" },
  { id: "monitoring", title: "Live Telemetry Cockpit", category: "Operations", tab: "monitoring", description: "High-frequency streaming gauges, tether tension, and wind vectors" },
  { id: "telemetry", title: "Telemetry Explorer & Time Series", category: "Telemetry", tab: "telemetry", description: "Multi-parameter telemetry charts, ranges & CSV data export" },
  { id: "health", title: "System Health & Diagnostics", category: "Diagnostics", tab: "health", description: "Subsystem health tree, thermal statuses & sensor health" },
  { id: "alerts", title: "Alerts & Operational Incidents", category: "Alerts", tab: "alerts", description: "Safety breaches, alarms, acknowledgment & event log" },
  { id: "analytics", title: "Renewable Energy Analytics", category: "Analytics", tab: "analytics", description: "Capacity utilization factor, diurnal curves, yield history" },
  { id: "components", title: "Hardware Assets & Components", category: "Hardware", tab: "components", description: "Turbines, tethers, winches, power converters & sensors" },
  { id: "maintenance", title: "Maintenance Operations", category: "Operations", tab: "maintenance", description: "Preventative, corrective, inspection work orders" },
  { id: "admin", title: "Platform Administration & Control", category: "Admin", tab: "admin", description: "User accounts, safety envelopes & operational audit logs" },
  { id: "profile", title: "User Account & Security", category: "Account", tab: "profile", description: "Profile details, password, session security" },
];

export function Topbar({
  user,
  onMenuToggle,
  onRefresh,
  isRefreshing,
  title,
  subtitle,
  theme = "dark",
  onThemeToggle,
  onNavigateTab,
  onLogout
}: TopbarProps) {
  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const searchRef = useRef<HTMLDivElement>(null);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  const [timeStr, setTimeStr] = useState("");
  const [dateStr, setDateStr] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      setDateStr(now.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const filteredResults = search.trim()
    ? SEARCH_TARGETS.filter(t => 
        t.title.toLowerCase().includes(search.toLowerCase()) || 
        t.category.toLowerCase().includes(search.toLowerCase()) ||
        t.description.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  const emailPrefix = user?.email?.split("@")[0] || "";
  const name = emailPrefix
    .split(/[-._]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ") || "User";

  const initials = name.includes(" ")
    ? name.split(" ").map(w => w.charAt(0)).join("").substring(0, 2).toUpperCase()
    : name.substring(0, 2).toUpperCase();

  const customId = formatUserId(user);

  // Close dropdown on clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header style={{
      height: "var(--header-h)",
      background: "var(--bg-soft)",
      borderBottom: "1px solid var(--border)",
      display: "flex",
      alignItems: "center",
      padding: "0 24px",
      gap: 16,
      position: "sticky",
      top: 0,
      zIndex: 30,
    }}>
      {/* Mobile menu toggle */}
      <button onClick={onMenuToggle} style={{ color: "var(--text-secondary)", background: "none", border: "none", cursor: "pointer" }}>
        <Menu size={18} />
      </button>

      {/* Page title */}
      <div style={{ flex: 1 }}>
        <p style={{
          fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15,
          color: "var(--text)", letterSpacing: "0.06em", textTransform: "uppercase",
        }}>
          {title}
        </p>
        {subtitle && (
          <p style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginTop: 1 }}>
            {subtitle}
          </p>
        )}
      </div>

      {/* Search */}
      <div style={{ position: "relative", display: "flex", alignItems: "center" }} ref={searchRef}>
        <Search size={13} style={{
          position: "absolute", left: 10,
          color: "var(--text-muted)", pointerEvents: "none"
        }} />
        <input
          className="source-input"
          style={{ paddingLeft: 30, width: 260, height: 36, fontSize: 12 }}
          placeholder="Search products, alerts, pages..."
          value={search}
          onFocus={() => setShowSearchDropdown(true)}
          onChange={e => { setSearch(e.target.value); setShowSearchDropdown(true); }}
        />

        {/* Live Search Results Dropdown Popup */}
        {showSearchDropdown && search.trim().length > 0 && (
          <div style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: 320,
            background: "var(--bg-soft)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            boxShadow: "var(--shadow-lg)",
            padding: "6px 0",
            display: "flex",
            flexDirection: "column",
            zIndex: 200,
            maxHeight: 320,
            overflowY: "auto"
          }}>
            {filteredResults.length === 0 ? (
              <div style={{ padding: "12px 16px", fontSize: 12, color: "var(--text-muted)", textAlign: "center" }}>
                No matching pages, devices, or alerts found.
              </div>
            ) : (
              filteredResults.map(res => (
                <div
                  key={res.id}
                  onClick={() => {
                    if (onNavigateTab) onNavigateTab(res.tab);
                    setSearch("");
                    setShowSearchDropdown(false);
                  }}
                  style={{
                    padding: "10px 14px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                    cursor: "pointer",
                    borderBottom: "1px solid rgba(255,255,255,0.03)",
                    transition: "background 0.15s ease"
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(0,123,255,0.08)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>{res.title}</span>
                    <span className="badge badge-info" style={{ fontSize: 9, padding: "2px 6px" }}>{res.category}</span>
                  </div>
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{res.description}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Live Digital Clock with Seconds */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        background: "rgba(0,123,255,0.06)",
        border: "1px solid rgba(0,123,255,0.15)",
        borderRadius: "var(--radius-sm)",
        padding: "4px 10px",
        height: 36,
        flexShrink: 0
      }}>
        <Clock size={13} style={{ color: "var(--accent)" }} />
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, color: "var(--text)", letterSpacing: "0.05em", lineHeight: 1 }}>
            {timeStr || "--:--:--"}
          </span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--text-muted)", marginTop: 2, lineHeight: 1 }}>
            {dateStr}
          </span>
        </div>
      </div>

      {/* Theme Toggle Switcher */}
      {onThemeToggle && (
        <button
          onClick={onThemeToggle}
          className="btn btn-ghost btn-sm"
          title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          {theme === "dark" ? <Sun size={13} /> : <Moon size={13} />}
        </button>
      )}

      {/* Refresh */}
      {onRefresh && (
        <button
          onClick={onRefresh}
          className="btn btn-ghost btn-sm"
          disabled={isRefreshing}
          title="Refresh data"
        >
          <RefreshCw size={13} className={isRefreshing ? "animate-spin" : ""} />
        </button>
      )}

      {/* User avatar wrapper for dropdown */}
      <div style={{ position: "relative" }} ref={dropdownRef}>
        <div
          onClick={() => setShowDropdown(prev => !prev)}
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "linear-gradient(135deg, var(--accent), #0052cc)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: 13,
            color: "white",
            cursor: "pointer",
            flexShrink: 0,
            boxShadow: "0 0 0 2px rgba(0,123,255,0.2)",
          }}
        >
          {initials}
        </div>

        {/* Dropdown Options Menu */}
        {showDropdown && (
          <div style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 8px)",
            width: 240,
            background: "var(--bg-soft)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            boxShadow: "var(--shadow-lg)",
            padding: "8px 0",
            display: "flex",
            flexDirection: "column",
            zIndex: 100,
            animation: "slide-down 0.15s ease"
          }}>
            <div style={{ padding: "8px 16px 12px 16px", borderBottom: "1px solid var(--border)", marginBottom: 6 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {name}
              </p>
              <p style={{ fontSize: 10, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 2 }}>
                {user?.email}
              </p>
              {customId && (
                <p style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--text-muted)", marginTop: 4 }}>
                  {customId}
                </p>
              )}
              <span style={{
                fontSize: 9,
                background: "rgba(0,123,255,0.15)",
                color: "var(--accent)",
                padding: "2px 6px",
                borderRadius: 4,
                fontWeight: 600,
                marginTop: 6,
                display: "inline-block"
              }}>
                {user?.role}
              </span>
            </div>

            {/* Menu options */}
            {onNavigateTab && (
              <>
                <button
                  onClick={() => { onNavigateTab("profile"); setShowDropdown(false); }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    width: "100%",
                    padding: "10px 16px",
                    background: "none",
                    border: "none",
                    color: "var(--text)",
                    fontSize: 13,
                    textAlign: "left",
                    cursor: "pointer",
                    transition: "background 0.2s"
                  }}
                  className="dropdown-item"
                >
                  <UserIcon size={14} style={{ color: "var(--text-secondary)" }} />
                  <span>My Profile</span>
                </button>

                <button
                  onClick={() => { onNavigateTab("settings"); setShowDropdown(false); }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    width: "100%",
                    padding: "10px 16px",
                    background: "none",
                    border: "none",
                    color: "var(--text)",
                    fontSize: 13,
                    textAlign: "left",
                    cursor: "pointer",
                    transition: "background 0.2s"
                  }}
                  className="dropdown-item"
                >
                  <Settings size={14} style={{ color: "var(--text-secondary)" }} />
                  <span>Security Settings</span>
                </button>
              </>
            )}

            {onLogout && (
              <button
                onClick={() => { onLogout(); setShowDropdown(false); }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  width: "100%",
                  padding: "10px 16px",
                  background: "none",
                  border: "none",
                  color: "var(--error)",
                  fontSize: 13,
                  textAlign: "left",
                  cursor: "pointer",
                  borderTop: "1px solid var(--border)",
                  marginTop: 6,
                  transition: "background 0.2s"
                }}
                className="dropdown-item"
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

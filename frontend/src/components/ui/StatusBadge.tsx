"use client";
// ============================================================
// StatusBadge — displays product/alert/complaint status
// ============================================================
import React from "react";

type BadgeVariant =
  | "online" | "offline" | "failed" | "maintenance"
  | "critical" | "warning" | "info" | "open" | "resolved"
  | "in_progress" | "acknowledged" | "pending" | "approved"
  | "rejected" | "closed" | "low" | "medium" | "high" | "urgent"
  | "available" | "claimed" | "new";

const variantMap: Record<BadgeVariant, string> = {
  online:        "badge badge-online",
  offline:       "badge badge-offline",
  failed:        "badge badge-failed",
  maintenance:   "badge badge-warn",
  critical:      "badge badge-failed",
  warning:       "badge badge-warn",
  info:          "badge badge-info",
  open:          "badge badge-warn",
  resolved:      "badge badge-online",
  in_progress:   "badge badge-info",
  acknowledged:  "badge badge-info",
  pending:       "badge badge-warn",
  approved:      "badge badge-online",
  rejected:      "badge badge-failed",
  closed:        "badge badge-offline",
  low:           "badge badge-offline",
  medium:        "badge badge-warn",
  high:          "badge badge-failed",
  urgent:        "badge badge-failed",
  available:     "badge badge-info",
  claimed:       "badge badge-online",
  new:           "badge badge-info",
};

interface Props {
  status: BadgeVariant;
  pulse?: boolean;
}

export function StatusBadge({ status, pulse }: Props) {
  const cls = variantMap[status] ?? "badge badge-offline";
  const label = status.replace(/_/g, " ");
  return (
    <span className={cls} style={{ position: "relative" }}>
      {pulse && status === "online" && (
        <span
          style={{
            display: "inline-block",
            width: 7, height: 7,
            borderRadius: "50%",
            background: "var(--green)",
            animation: "pulse-dot 2.2s ease-in-out infinite",
          }}
        />
      )}
      {label}
    </span>
  );
}

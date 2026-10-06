import React, { useEffect, useState } from "react";
import { ClipboardList, Clock, CheckCircle, XCircle } from "lucide-react";
import { api } from "@/lib/api";

export function MyRequestsPanel() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch user's registration/consultation requests
    api.registrations.list().then(data => {
      setRequests(data as any[]);
    }).catch(err => {
      console.error(err);
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved": return "var(--green)";
      case "rejected": return "var(--error)";
      default: return "var(--warn)";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved": return <CheckCircle size={14} />;
      case "rejected": return <XCircle size={14} />;
      default: return <Clock size={14} />;
    }
  };

  return (
    <div className="animate-slide-up" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, letterSpacing: "0.04em", textTransform: "uppercase" }}>
            My Requests
          </h2>
          <p style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginTop: 2 }}>
            Track your consultation and registration requests
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Loading requests...</div>
      ) : requests.length === 0 ? (
        <div className="source-card" style={{ padding: "64px 24px", textAlign: "center" }}>
          <ClipboardList size={32} style={{ opacity: 0.3, margin: "0 auto 16px" }} />
          <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--text)" }}>No Requests Found</h3>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 8 }}>You haven't submitted any requests yet.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {requests.map(req => (
            <div key={req.id} className="source-card" style={{ padding: 24, display: "flex", flexWrap: "wrap", gap: 24, justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 11, background: "rgba(0,123,255,0.1)", color: "var(--blue)", padding: "4px 8px", borderRadius: 4, fontWeight: 600, textTransform: "uppercase" }}>
                    {req.request_type || "Registration"}
                  </span>
                  <span style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                    {new Date(req.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                  </span>
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>
                  {req.details?.product_requested || "General Inquiry"}
                </h3>
                <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                  Company: {req.details?.companyName || "N/A"}
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, color: getStatusColor(req.status), fontSize: 14, fontWeight: 600, textTransform: "capitalize" }}>
                  {getStatusIcon(req.status)} {req.status}
                </div>
                
                {req.status === "pending" && (
                  <button className="btn btn-ghost btn-sm" style={{ color: "var(--error)" }}>
                    Cancel Request
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

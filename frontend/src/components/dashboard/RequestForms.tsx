import React, { useState } from "react";
import { ArrowLeft, Send } from "lucide-react";
import { api, getToken } from "@/lib/api";

interface Props {
  formType: "registration" | "consultation" | "sales";
  product: any;
  onBack: () => void;
}

export function RequestForms({ formType, product, onBack }: Props) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    companyName: "",
    contactPerson: "",
    phone: "",
    email: "",
    city: "",
    state: "",
    country: "",
    address: "",
    industry: "",
    purpose: "Commercial",
    timeline: "",
    requirements: "",
    contactMethod: "Email",
    date: "",
    time: "",
    meetingMode: "Google Meet"
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        serial_number: null, // Nullable now in DB
        request_type: formType,
        details: {
          product_requested: product?.name || "General Inquiry",
          ...formData
        }
      };

      const res = await fetch(`http://${window.location.hostname}:8000/api/v1/products/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.detail || "Failed to submit request.");
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  if (success) {
    return (
      <div className="animate-slide-up" style={{ textAlign: "center", padding: "100px 20px" }}>
        <div style={{ width: 64, height: 64, background: "rgba(50,205,50,0.1)", color: "var(--green)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
          <Send size={32} />
        </div>
        <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 24, marginBottom: 16 }}>Request Submitted Successfully</h2>
        <p style={{ color: "var(--text-secondary)", marginBottom: 32 }}>Our sales team will contact you shortly after verification.</p>
        <button className="btn btn-primary" onClick={onBack}>Return to Catalog</button>
      </div>
    );
  }

  const titles = {
    registration: "Request Registration",
    consultation: "Book a Consultation",
    sales: "Contact Sales"
  };

  return (
    <div className="animate-slide-up" style={{ maxWidth: 800, margin: "0 auto", paddingBottom: 60 }}>
      <button className="btn btn-ghost" onClick={onBack} style={{ marginBottom: 24, paddingLeft: 0 }}>
        <ArrowLeft size={16} style={{ marginRight: 8 }} /> Back
      </button>

      <div className="source-card" style={{ padding: 40 }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 28, marginBottom: 8, color: "var(--text)" }}>
          {titles[formType]}
        </h2>
        {product && (
          <p style={{ color: "var(--text-secondary)", marginBottom: 32 }}>
            Inquiring about: <strong>{product.name}</strong>
          </p>
        )}

        {error && (
          <div style={{ padding: 16, background: "rgba(229,72,77,0.1)", color: "var(--error)", borderRadius: 8, marginBottom: 24 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Common Fields */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div className="source-field">
              <label>Company Name</label>
              <input required type="text" name="companyName" className="source-input" value={formData.companyName} onChange={handleChange} />
            </div>
            <div className="source-field">
              <label>Contact Person</label>
              <input required type="text" name="contactPerson" className="source-input" value={formData.contactPerson} onChange={handleChange} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div className="source-field">
              <label>Email Address</label>
              <input required type="email" name="email" className="source-input" value={formData.email} onChange={handleChange} />
            </div>
            <div className="source-field">
              <label>Phone Number</label>
              <input required type="text" name="phone" className="source-input" value={formData.phone} onChange={handleChange} />
            </div>
          </div>

          {/* Registration Specific Fields */}
          {formType === "registration" && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                <div className="source-field">
                  <label>City</label>
                  <input required type="text" name="city" className="source-input" value={formData.city} onChange={handleChange} />
                </div>
                <div className="source-field">
                  <label>State</label>
                  <input required type="text" name="state" className="source-input" value={formData.state} onChange={handleChange} />
                </div>
                <div className="source-field">
                  <label>Country</label>
                  <input required type="text" name="country" className="source-input" value={formData.country} onChange={handleChange} />
                </div>
              </div>
              <div className="source-field">
                <label>Installation Address</label>
                <input required type="text" name="address" className="source-input" value={formData.address} onChange={handleChange} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div className="source-field">
                  <label>Industry</label>
                  <input required type="text" name="industry" className="source-input" value={formData.industry} onChange={handleChange} />
                </div>
                <div className="source-field">
                  <label>Purpose</label>
                  <select name="purpose" className="source-input" value={formData.purpose} onChange={handleChange}>
                    <option>Residential</option>
                    <option>Commercial</option>
                    <option>Industrial</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {/* Consultation Specific Fields */}
          {formType === "consultation" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
              <div className="source-field">
                <label>Preferred Date</label>
                <input required type="date" name="date" className="source-input" value={formData.date} onChange={handleChange} />
              </div>
              <div className="source-field">
                <label>Preferred Time</label>
                <input required type="time" name="time" className="source-input" value={formData.time} onChange={handleChange} />
              </div>
              <div className="source-field">
                <label>Meeting Mode</label>
                <select name="meetingMode" className="source-input" value={formData.meetingMode} onChange={handleChange}>
                  <option>Phone</option>
                  <option>Google Meet</option>
                  <option>Zoom</option>
                  <option>Microsoft Teams</option>
                </select>
              </div>
            </div>
          )}

          <div className="source-field">
            <label>Additional Requirements / Notes</label>
            <textarea name="requirements" className="source-input" rows={4} value={formData.requirements} onChange={handleChange}></textarea>
          </div>

          <div style={{ display: "flex", gap: 16, marginTop: 16, borderTop: "1px solid var(--border)", paddingTop: 24 }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Submitting..." : "Submit Request"}
            </button>
            <button type="button" className="btn btn-ghost" onClick={onBack}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

"use client";
import React, { useEffect, useRef, useState } from "react";
import { MapPin, Battery, Clock, Compass, Search } from "lucide-react";

interface InteractiveStationMapProps {
  stations: any[];
  onSelectStation?: (station: any) => void;
  focusedStationId?: string | null;
}

export function InteractiveStationMap({ stations, onSelectStation, focusedStationId }: InteractiveStationMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [selectedStation, setSelectedStation] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  // Dynamically load Leaflet from CDN
  useEffect(() => {
    if (typeof window === "undefined") return;
    if ((window as any).L) {
      setLeafletLoaded(true);
      return;
    }

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => setLeafletLoaded(true);
    document.head.appendChild(script);

    return () => {};
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!leafletLoaded || !mapContainerRef.current || mapInstance) return;

    const L = (window as any).L;
    // Default center Pune
    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
    }).setView([18.5204, 73.8567], 11);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    setMapInstance(map);

    return () => {
      map.remove();
    };
  }, [leafletLoaded]);

  // Handle focusedStationId zoom & pan
  useEffect(() => {
    if (!mapInstance || !focusedStationId) return;
    const match = stations.find(s => s.id === focusedStationId || s.product_code === focusedStationId);
    if (match) {
      const lat = match.install_lat || 18.5204;
      const lng = match.install_lng || 73.8567;
      mapInstance.flyTo([lat, lng], 15, { duration: 1.2 });
      setSelectedStation(match);

      if (mapContainerRef.current) {
        mapContainerRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [focusedStationId, mapInstance, stations]);

  // Update Markers when stations or map instance changes
  useEffect(() => {
    if (!mapInstance) return;
    const L = (window as any).L;

    // Clear existing markers
    markers.forEach(m => m.remove());
    const newMarkers: any[] = [];

    stations.forEach(station => {
      const lat = station.install_lat || 18.5204;
      const lng = station.install_lng || 73.8567;
      const statusColor = station.status === "online" ? "#10B981" : station.status === "maintenance" ? "#F59E0B" : "#EF4444";

      // Custom HTML Marker matching system theme
      const customIcon = L.divIcon({
        className: "custom-marker-icon",
        html: `
          <div style="
            width: 26px;
            height: 26px;
            background: ${statusColor};
            border: 3px solid rgba(255, 255, 255, 0.9);
            border-radius: 50%;
            box-shadow: 0 4px 12px rgba(0,0,0,0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 11px;
            font-weight: bold;
            cursor: pointer;
            transition: transform 200ms ease;
          ">
            ⚡
          </div>
        `,
        iconSize: [26, 26],
        iconAnchor: [13, 13]
      });

      const marker = L.marker([lat, lng], { icon: customIcon }).addTo(mapInstance);
      
      marker.on("click", () => {
        setSelectedStation(station);
        if (onSelectStation) onSelectStation(station);
        mapInstance.flyTo([lat, lng], 15, { duration: 1.0 });
      });

      newMarkers.push(marker);
    });

    setMarkers(newMarkers);

    // Fit map bounds if there are markers and no specific focusedStationId
    if (stations.length > 0 && !focusedStationId) {
      const bounds = L.latLngBounds(stations.map(s => [s.install_lat || 18.5204, s.install_lng || 73.8567]));
      mapInstance.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [stations, mapInstance]);

  const handleSearch = () => {
    if (!mapInstance || !searchQuery) return;
    const query = searchQuery.toLowerCase();
    
    // Find matching station by name or address
    const match = stations.find(s => 
      (s.station_name && s.station_name.toLowerCase().includes(query)) ||
      (s.station_address && s.station_address.toLowerCase().includes(query))
    );

    if (match) {
      const lat = match.install_lat || 18.5204;
      const lng = match.install_lng || 73.8567;
      mapInstance.setView([lat, lng], 14);
      setSelectedStation(match);
    }
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "500px", borderRadius: "var(--radius-lg)", overflow: "hidden", border: "1px solid var(--border)" }}>
      {/* Search overlay */}
      <div style={{
        position: "absolute",
        top: 16,
        left: 16,
        zIndex: 1000,
        display: "flex",
        gap: 8,
        background: "rgba(255, 255, 255, 0.85)",
        backdropFilter: "blur(12px)",
        padding: "6px 12px",
        borderRadius: "var(--radius-md)",
        border: "1px solid rgba(0,0,0,0.08)",
        width: "320px",
        boxShadow: "var(--shadow-md)"
      }}>
        <Search size={16} style={{ color: "var(--text-muted)", alignSelf: "center" }} />
        <input
          type="text"
          placeholder="Search by city or station name..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSearch()}
          style={{
            background: "transparent",
            border: "none",
            outline: "none",
            fontSize: "13px",
            width: "100%",
            color: "#1E293B"
          }}
        />
        <button
          onClick={handleSearch}
          className="btn btn-sm btn-primary"
          style={{ padding: "4px 10px", fontSize: "11px" }}
        >
          Go
        </button>
      </div>

      {/* Map Container */}
      <div ref={mapContainerRef} style={{ width: "100%", height: "100%", background: "#F1F5F9" }} />

      {/* Glassmorphic Station Details Card Overlay */}
      {selectedStation && (
        <div style={{
          position: "absolute",
          bottom: 16,
          right: 16,
          zIndex: 1000,
          background: "rgba(255, 255, 255, 0.9)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(255, 255, 255, 0.6)",
          boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
          borderRadius: "var(--radius-lg)",
          padding: 20,
          width: "360px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          animation: "slide-up 0.3s ease-out",
          color: "#0F172A"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: "var(--text)" }}>
                {selectedStation.station_name || "Green Charge Hub"}
              </h3>
              <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "4px 0 0 0" }}>
                {selectedStation.station_address || "Koregaon Park, Pune"}
              </p>
            </div>
            <button
              onClick={() => setSelectedStation(null)}
              style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: 16, color: "var(--text-muted)" }}
            >
              ✕
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Battery size={14} style={{ color: "var(--blue)" }} />
              <span>Health: <strong>{selectedStation.battery_health}%</strong></span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Compass size={14} style={{ color: "var(--green)" }} />
              <span>Available: <strong>{selectedStation.available_ports} / {selectedStation.total_ports}</strong></span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Clock size={14} style={{ color: "var(--warning)" }} />
              <span>Wait Time: <strong>~{selectedStation.available_ports > 0 ? "0" : "15"} mins</strong></span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span>Type: <strong>{selectedStation.charger_type || "Fast DC"}</strong></span>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${selectedStation.install_lat || 18.5204},${selectedStation.install_lng || 73.8567}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary btn-sm"
              style={{ flex: 1, textDecoration: "none", justifyContent: "center", display: "flex", alignItems: "center" }}
            >
              <Compass size={13} style={{ marginRight: 6 }} /> Navigate in Maps
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

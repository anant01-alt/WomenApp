"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import type { NearbyPlace } from "@/lib/maps/overpass";

// Default marker icons are broken under Next bundling — provide our own.
const userIcon = L.divIcon({
  className: "",
  html: `<div style="background:var(--brand-pink);color:white;border-radius:50%;width:28px;height:28px;display:grid;place-items:center;font-weight:700;font-size:12px;box-shadow:0 0 24px var(--brand-pink)">You</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

function markerFor(kind: NearbyPlace["kind"]) {
  const color =
    kind === "police" ? "#3b82f6" : kind === "hospital" ? "#ef4444" : "#22c55e";
  const letter = kind === "police" ? "P" : kind === "hospital" ? "H" : "Rx";
  return L.divIcon({
    className: "",
    html: `<div style="background:${color};color:white;border-radius:50%;width:24px;height:24px;display:grid;place-items:center;font-weight:700;font-size:10px">${letter}</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

export function LeafletMap({
  center,
  places,
  emergencyRadiusM,
}: {
  center: { lat: number; lng: number };
  places: NearbyPlace[];
  emergencyRadiusM?: number | null;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const view = useMemo(
    () => [center.lat, center.lng] as [number, number],
    [center],
  );

  if (!mounted) {
    return (
      <div className="h-[420px] md:h-[540px] rounded-2xl bg-muted animate-pulse" />
    );
  }

  return (
    <MapContainer
      center={view}
      zoom={15}
      scrollWheelZoom
      className="h-[420px] md:h-[540px] rounded-2xl border border-border overflow-hidden"
    >
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      <Marker position={view} icon={userIcon}>
        <Popup>You are here</Popup>
      </Marker>
      {emergencyRadiusM ? (
        <Circle
          center={view}
          radius={emergencyRadiusM}
          pathOptions={{
            color: "var(--brand-pink)",
            fillOpacity: 0.1,
            opacity: 0.6,
          }}
        />
      ) : null}
      {places.map((p) => (
        <Marker key={p.id} position={[p.lat, p.lng]} icon={markerFor(p.kind)}>
          <Popup>
            <div className="text-sm">
              <div className="font-semibold capitalize">{p.name}</div>
              <div className="text-muted-foreground capitalize">{p.kind}</div>
              <div>{Math.round(p.distanceMeters)} m away</div>
              <a
                href={`https://www.openstreetmap.org/?mlat=${p.lat}&mlon=${p.lng}#map=18/${p.lat}/${p.lng}`}
                target="_blank"
                rel="noreferrer"
                className="text-primary"
              >
                Open in map
              </a>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

// PlaceLegend lives in @/components/map/place-legend for SSR-safety.

"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { NearbyPlace } from "@/lib/maps/overpass";
import { fetchNearby } from "./actions";
import { PlaceLegend } from "@/components/map/place-legend";

// Leaflet hits `window` at import time — must be SSR-disabled.
const LeafletMap = dynamic(
  () => import("@/components/map/leaflet-map").then((m) => m.LeafletMap),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[420px] md:h-[540px] rounded-2xl" />,
  },
);

export function MapView() {
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);
  const [places, setPlaces] = useState<NearbyPlace[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation isn't available.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const next = {
          lat: p.coords.latitude,
          lng: p.coords.longitude,
        };
        setPos(next);
        startTransition(async () => {
          setPlaces(await fetchNearby(next.lat, next.lng));
        });
      },
      (e) => setError(e.message),
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }, []);

  if (error) {
    return (
      <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-6 text-sm">
        <p className="text-destructive font-medium">Can&apos;t show the map</p>
        <p className="text-muted-foreground mt-1">{error}</p>
        <p className="text-muted-foreground mt-2">
          Allow location in your browser&apos;s site settings and reload.
        </p>
      </div>
    );
  }

  if (!pos) {
    return <Skeleton className="h-[420px] md:h-[540px] rounded-2xl" />;
  }

  return (
    <div className="space-y-4">
      <LeafletMap center={pos} places={places} />
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
        <PlaceLegend />
        <div className="inline-flex items-center gap-3">
          <span>
            {pending
              ? "Finding nearby places…"
              : `${places.length} places within 2.5 km`}
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              startTransition(async () => {
                setPlaces(await fetchNearby(pos.lat, pos.lng));
              })
            }
            disabled={pending}
          >
            Refresh
          </Button>
        </div>
      </div>
    </div>
  );
}

"use server";

import { nearbyPlaces } from "@/lib/maps/overpass";

export async function fetchNearby(lat: number, lng: number) {
  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    return [];
  }
  return nearbyPlaces({ lat, lng });
}

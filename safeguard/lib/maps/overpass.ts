/**
 * Overpass API — free nearby-place lookup using OpenStreetMap data.
 * No API key, no billing account. Use for police stations, hospitals, pharmacies.
 *
 * Docs: https://wiki.openstreetmap.org/wiki/Overpass_API
 */

export type NearbyPlace = {
  id: number;
  kind: "police" | "hospital" | "pharmacy";
  name: string;
  lat: number;
  lng: number;
  distanceMeters: number;
};

const ENDPOINT = "https://overpass-api.de/api/interpreter";

function haversineMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6_371_000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export async function nearbyPlaces({
  lat,
  lng,
  radiusMeters = 2500,
}: {
  lat: number;
  lng: number;
  radiusMeters?: number;
}): Promise<NearbyPlace[]> {
  const query = `
    [out:json][timeout:15];
    (
      node["amenity"="police"](around:${radiusMeters},${lat},${lng});
      node["amenity"="hospital"](around:${radiusMeters},${lat},${lng});
      node["amenity"="pharmacy"](around:${radiusMeters},${lat},${lng});
      way["amenity"="police"](around:${radiusMeters},${lat},${lng});
      way["amenity"="hospital"](around:${radiusMeters},${lat},${lng});
    );
    out center tags 50;
  `;

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `data=${encodeURIComponent(query)}`,
    next: { revalidate: 60 * 10 }, // 10-min edge cache
  });

  if (!res.ok) return [];

  type Element = {
    type: "node" | "way";
    id: number;
    lat?: number;
    lon?: number;
    center?: { lat: number; lon: number };
    tags?: Record<string, string>;
  };

  const data: { elements?: Element[] } = await res.json();

  return (data.elements ?? [])
    .map((e) => {
      const p = e.type === "node" ? e : e.center;
      if (!p?.lat || !p?.lon) return null;
      const amenity = e.tags?.amenity;
      if (amenity !== "police" && amenity !== "hospital" && amenity !== "pharmacy")
        return null;
      return {
        id: e.id,
        kind: amenity as NearbyPlace["kind"],
        name: e.tags?.name ?? `${amenity[0].toUpperCase()}${amenity.slice(1)}`,
        lat: p.lat,
        lng: p.lon,
        distanceMeters: haversineMeters({ lat, lng }, { lat: p.lat, lng: p.lon }),
      };
    })
    .filter((x): x is NearbyPlace => x !== null)
    .sort((a, b) => a.distanceMeters - b.distanceMeters)
    .slice(0, 20);
}

import { Shield, Cross, Pill } from "lucide-react";

/**
 * Tiny static legend for nearby-places markers. Lives in its own file so it
 * can be imported statically without pulling in Leaflet's window-touching code.
 */
export function PlaceLegend() {
  return (
    <div className="flex flex-wrap gap-3 text-xs">
      <span className="inline-flex items-center gap-1.5">
        <Shield className="size-3.5" style={{ color: "#3b82f6" }} />
        Police
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Cross className="size-3.5" style={{ color: "#ef4444" }} />
        Hospital
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Pill className="size-3.5" style={{ color: "#22c55e" }} />
        Pharmacy
      </span>
    </div>
  );
}

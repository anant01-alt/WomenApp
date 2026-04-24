import { MapIcon } from "lucide-react";
import {
  PageContainer,
  PageHeader,
} from "@/components/layout/page-header";
import { MapView } from "./map-view";

export default function MapPage() {
  return (
    <PageContainer>
      <PageHeader
        icon={MapIcon}
        title="Map"
        description="Your current location and the nearest police stations, hospitals, and pharmacies within 2.5 km. Powered by OpenStreetMap + Overpass — no API key or billing required."
      />
      <MapView />
    </PageContainer>
  );
}

"use client"

import dynamic from 'next/dynamic';
import { MapDevice } from "@/hooks/use-map-data";
import L from 'leaflet';

// Define props interface to ensure type safety
interface DynamicMapProps {
  devices: MapDevice[];
  selectedDevice?: MapDevice | null;
  onMarkerClick?: (device: MapDevice) => void;
  center: { lat: number; lng: number };
  mapRef?: (map: L.Map | null) => void;
  pathCoordinates?: { lat: number; lng: number }[];
  journeyMarkers?: {
    start?: { lat: number; lng: number };
    end?: { lat: number; lng: number };
  };
}

const MapClientComponent = dynamic(() => import('./map-client'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
      <div className="text-center text-muted-foreground">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p>Loading interactive map...</p>
      </div>
    </div>
  ),
});

export default function DynamicMap(props: DynamicMapProps) {
  return <MapClientComponent {...props} />;
}


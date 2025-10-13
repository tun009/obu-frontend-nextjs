"use client"

import { useEffect, useRef } from 'react';
import { createJourneyVehicleIcon } from './journey-map-icon';

// Define the props for the Journey Map Client
interface JourneyMapClientProps {
  fullPathCoordinates: { lat: number; lng: number }[];
  progressPathCoordinates: { lat: number; lng: number }[];
  vehiclePosition?: { lat: number; lng: number; direction?: number; };
  startPosition?: { lat: number; lng: number };
  endPosition?: { lat: number; lng: number };
}

export default function JourneyMapClient({
  fullPathCoordinates,
  progressPathCoordinates,
  vehiclePosition,
  startPosition,
  endPosition,
}: JourneyMapClientProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const layersRef = useRef<any>({}); // To hold references to layers for easy clearing
  const pluginLoadedRef = useRef(false);

   useEffect(() => {
    if (typeof window !== 'undefined' && !pluginLoadedRef.current) {
      import('leaflet-rotatedmarker');
      pluginLoadedRef.current = true;
    }
  }, []);
  // Effect for initializing the map once
  useEffect(() => {
    let map: any;
    const initializeMap = async () => {
      if (!mapContainerRef.current || mapInstanceRef.current) return;

      const L = (await import('leaflet')).default;

      // Fix default icon path issue with webpack
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      map = L.map(mapContainerRef.current, {
        zoom: 10,
        center: [21.0285, 105.8542], // Default center, will be adjusted by fitBounds
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map);

      mapInstanceRef.current = map;

      // Fit map to the full journey path on initial load
      if (fullPathCoordinates.length > 0) {
        const bounds = L.latLngBounds(fullPathCoordinates.map(p => [p.lat, p.lng]));
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    };

    initializeMap();

    return () => {
      if (map) {
        map.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []); // Empty dependency array ensures this runs only once

  // Effect for drawing/updating layers when props change
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const map = mapInstanceRef.current;
    const L = require('leaflet');

    // 1. Clear old layers
    Object.values(layersRef.current).forEach((layer: any) => map.removeLayer(layer));
    layersRef.current = {};

    // 2. Draw Full Path (Blue)
    // if (fullPathCoordinates.length > 0) {
    //   const latLngs = fullPathCoordinates.map(p => [p.lat, p.lng]);
    //   layersRef.current.fullPath = L.polyline(latLngs, { color: '#3b82f6', weight: 5, opacity: 0.8 }).addTo(map);
    // }

    // 3. Draw Progress Path (Green) on top of the blue path
    if (progressPathCoordinates.length > 0) {
      const latLngs = progressPathCoordinates.map(p => [p.lat, p.lng]);
      layersRef.current.progressPath = L.polyline(latLngs, { color: '#22c55e', weight: 3 }).addTo(map);
    }

    // 4. Draw Start/End Markers
    if (startPosition) {
      const startIcon = L.divIcon({
        html: `<svg width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="#22c55e" stroke="#fff" stroke-width="2"/><text x="12" y="16" text-anchor="middle" fill="#fff" font-size="10">S</text></svg>`,
        className: '', iconSize: [24, 24], iconAnchor: [12, 12]
      });
      layersRef.current.startMarker = L.marker([startPosition.lat, startPosition.lng], { icon: startIcon }).addTo(map);
    }
    if (endPosition) {
      const endIcon = L.divIcon({
        html: `<svg width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="#ef4444" stroke="#fff" stroke-width="2"/><text x="12" y="16" text-anchor="middle" fill="#fff" font-size="10">E</text></svg>`,
        className: '', iconSize: [24, 24], iconAnchor: [12, 12]
      });
      layersRef.current.endMarker = L.marker([endPosition.lat, endPosition.lng], { icon: endIcon }).addTo(map);
    }

    // 5. Draw Vehicle Marker
    if (vehiclePosition?.lat && vehiclePosition?.lng) {
      const vehicleIcon = createJourneyVehicleIcon();
      console.log('vehicleIcon',vehiclePosition);
      layersRef.current.vehicleMarker = L.marker([vehiclePosition.lat, vehiclePosition.lng], {
        icon: vehicleIcon,
        rotationAngle: (vehiclePosition.direction ?? 0),
        rotationOrigin: 'center center',
      }).addTo(map);
    }

  }, [fullPathCoordinates, progressPathCoordinates, vehiclePosition, startPosition, endPosition]);

  return <div ref={mapContainerRef} className="w-full h-full rounded-lg" />;
}


"use client"

import { useState, useEffect, useRef } from "react"
import { MapDevice } from "@/hooks/use-map-data"
import { createDeviceIcon } from './map-icon';

interface MapClientProps {
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

export default function MapClient({
  devices,
  selectedDevice,
  onMarkerClick,
  center,
  mapRef,
  pathCoordinates,
  journeyMarkers
}: MapClientProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const journeyLayersRef = useRef<{
    path?: L.Polyline;
    start?: L.Marker;
    end?: L.Marker;
  }>({});
  const markersRef = useRef<Map<string | number, any>>(new Map());
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const pluginLoadedRef = useRef(false);

  // Dynamically import the plugin on the client side to avoid SSR issues
  useEffect(() => {
    if (typeof window !== 'undefined' && !pluginLoadedRef.current) {
      import('leaflet-rotatedmarker');
      pluginLoadedRef.current = true;
    }
  }, []);

  useEffect(() => {
    const initializeMap = async () => {
      try {
        if (!mapContainerRef.current) return

        // Dynamic import to avoid SSR issues
        const L = (await import('leaflet')).default

        // // Fix for default markers
        // if (L.Icon.Default.prototype._getIconUrl) {
        //   delete (L.Icon.Default.prototype as any)._getIconUrl
        // }

        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        })

        // Clean up existing map
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove()
          mapInstanceRef.current = null
        }

        // Clear existing markers
        markersRef.current.clear();

        // Initialize map
        const validCenter = center && typeof center.lat === 'number' && typeof center.lng === 'number'
          ? [center.lat, center.lng] as [number, number]
          : [21.0285, 105.8542] as [number, number]

        mapInstanceRef.current = L.map(mapContainerRef.current, {
          center: validCenter,
          zoom: 15,
          zoomControl: true,
          attributionControl: true
        })

        // Define map layers
        const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        });

        const topoLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
            maxZoom: 17,
            attribution: 'Map data: © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: © <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
        });

        const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles © Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
        });

        const darkLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 20
        });

        // Set default layer
        osmLayer.addTo(mapInstanceRef.current);

        // Add layer control
        const baseLayers = {
            "Tiêu chuẩn": osmLayer,
            "Địa hình": topoLayer,
            "Vệ tinh": satelliteLayer,
            "Nền tối": darkLayer
        };

        L.control.layers(baseLayers).addTo(mapInstanceRef.current);

        // Pass map reference to parent
        if (mapRef) mapRef(mapInstanceRef.current)

        setIsLoading(false)
        setError(null)

      } catch (err) {
        console.error('Error initializing map:', err)
        setError('Failed to load map')
        setIsLoading(false)
      }
    }

    initializeMap()

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
      if (mapRef) mapRef(null)
    }
  }, [center.lat, center.lng, mapRef])

  // Update markers when devices change
  useEffect(() => {
    if (!mapInstanceRef.current || isLoading) return;

    const updateMarkers = async () => {
      try {
        const L = (await import('leaflet')).default;
        const deviceIdsOnMap = new Set(devices.map(d => d.id));
        // 1. Update existing markers and add new ones
        devices.forEach(device => {
          if (!device.latitude || !device.longitude) return;

          const popupContent = `
            <div class="p-2 min-w-[250px]">
              <div class="font-semibold text-base mb-2">${device.imei}</div>
              <div class="space-y-1 text-sm">
                <div>Status: <span class="font-medium">${device.status}</span></div>
                <div>Location: ${device.latitude?.toFixed(6)}, ${device.longitude?.toFixed(6)}</div>
                <div>Speed: ${device.speed || 0} km/h</div>
                <div>Plate: ${device.plate_number || "Unknown"}</div>
                <div class="text-xs text-gray-500">
                  Last update: ${device.last_update ? new Date(device.last_update).toLocaleString() : "Unknown"}
                </div>
              </div>
            </div>
          `;
          if (markersRef.current.has(device.id)) {
            // Marker exists: Update position, icon, and popup content
            const marker = markersRef.current.get(device.id);
            marker
              .setLatLng([device.latitude, device.longitude])
              .setIcon(createDeviceIcon(device.id));
            // Use the method from leaflet-rotatedmarker plugin
            if (marker.setRotationAngle) {
              marker.setRotationAngle(device.direction ?? 0);
            }

            // Only update popup content if it's not currently open, to avoid flicker
            if (!marker.isPopupOpen()) {
              marker.setPopupContent(popupContent);
            }
          } else {
            // Marker doesn't exist: Create and add it
            // Add rotationAngle option from the plugin
            const newMarker = L.marker([device.latitude, device.longitude], {
              icon: createDeviceIcon(device.id),
              rotationAngle: device.direction ?? 0,
              rotationOrigin: 'center center',
            } as any) // Use 'as any' to allow the custom option
              .addTo(mapInstanceRef.current)
              .bindPopup(popupContent)
              .on('click', () => {
                if (onMarkerClick) onMarkerClick(device);
              });

            markersRef.current.set(device.id, newMarker);
          }
        });

        // 2. Remove markers for devices that are no longer in the list
        markersRef.current.forEach((marker, deviceId) => {
          if (!deviceIdsOnMap.has(deviceId as any)) { // Use 'as any' to bypass strict type check
            mapInstanceRef.current.removeLayer(marker);
            markersRef.current.delete(deviceId);
          }
        });

      } catch (err) {
        console.error('Error updating markers:', err);
      }
    };

    updateMarkers();
  }, [devices, onMarkerClick, isLoading]);

  // Effect to open popup when selected device changes from parent
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Close all popups first to ensure only one is open at a time
    mapInstanceRef.current.closePopup();

    if (selectedDevice) {
      const marker = markersRef.current.get(selectedDevice.id);
      if (marker) {
        marker.openPopup();
      }
    }
  }, [selectedDevice]);

  // Effect to draw journey path and markers
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    const layers = journeyLayersRef.current;

    // This logic runs asynchronously, so we need to ensure L is available
    const drawJourney = async () => {
      const L = (await import('leaflet')).default;

      // Clear previous journey layers
      Object.values(layers).forEach(layer => map.removeLayer(layer));

      // Draw new path
      if (pathCoordinates && pathCoordinates.length > 0) {
        const latLngs = pathCoordinates.map(p => [p.lat, p.lng] as L.LatLngExpression);
        layers.path = L.polyline(latLngs, { color: "#3b82f6" }).addTo(map);
      }

      // Draw start/end markers
      if (journeyMarkers) {
        if (journeyMarkers.start) {
          const startIcon = L.divIcon({
            html: `<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="8" fill="#22c55e" stroke="#ffffff" strokeWidth="2"/><text x="12" y="16" text-anchor="middle" fill="#ffffff" font-size="10" font-weight="bold">S</text></svg>`,
            className: 'leaflet-div-icon',
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          });
          layers.start = L.marker([journeyMarkers.start.lat, journeyMarkers.start.lng], { icon: startIcon }).addTo(map);
        }
        if (journeyMarkers.end) {
          const endIcon = L.divIcon({
            html: `<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="8" fill="#ef4444" stroke="#ffffff" strokeWidth="2"/><text x="12" y="16" text-anchor="middle" fill="#ffffff" font-size="10" font-weight="bold">E</text></svg>`,
            className: 'leaflet-div-icon',
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          });
          layers.end = L.marker([journeyMarkers.end.lat, journeyMarkers.end.lng], { icon: endIcon }).addTo(map);
        }
      }
    };

    drawJourney();

  }, [pathCoordinates, journeyMarkers]);

  return (
    <div className="w-full h-full rounded-lg relative" style={{ minHeight: '400px' }}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50/80 z-10 rounded-lg">
          <div className="text-center text-muted-foreground">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Loading interactive map...</p>
          </div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-50/80 z-10 rounded-lg">
          <div className="text-center text-red-600">
            <p>{error}</p>
          </div>
        </div>
      )}
      <div
        ref={mapContainerRef}
        className="w-full h-full rounded-lg"
        style={{ minHeight: '400px', visibility: isLoading || error ? 'hidden' : 'visible' }}
      />
    </div>
  )
}

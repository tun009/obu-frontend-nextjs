'use client';

import React, { createContext, useContext } from 'react';
import { LoadScript } from '@react-google-maps/api';

interface GoogleMapsContextType {
  isLoaded: boolean;
}

const GoogleMapsContext = createContext<GoogleMapsContextType>({ isLoaded: false });

export function useGoogleMaps() {
  return useContext(GoogleMapsContext);
}

interface GoogleMapsProviderProps {
  children: React.ReactNode;
}

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY ?? "AIzaSyAOVYRIgupAurZup5y1PRh8Ismb1A3lLao";

export function GoogleMapsProvider({ children }: GoogleMapsProviderProps) {
  return (
    <LoadScript 
      googleMapsApiKey={GOOGLE_MAPS_API_KEY}
      onLoad={() => console.log('Google Maps loaded')}
      onError={(error) => console.error('Google Maps load error:', error)}
    >
      <GoogleMapsContext.Provider value={{ isLoaded: true }}>
        {children}
      </GoogleMapsContext.Provider>
    </LoadScript>
  );
}

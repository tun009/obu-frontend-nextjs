import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Convert GPS coordinates from DDMM.MMMM format to decimal degrees
 * @param coordinate - The coordinate value in DDMM.MMMM format
 * @param degree - The degree part of the coordinate
 * @returns Decimal degrees or undefined if invalid
 */
export function convertGpsCoordinate(coordinate?: number, degree?: number): number | undefined {
  if (coordinate === undefined || degree === undefined || coordinate === 0 || degree === 0) {
    return undefined;
  }

  try {
    // Convert from DDMM.MMMM to DD.DDDDDD
    const minutes = coordinate - (degree * 100);
    const decimalDegrees = degree + (minutes / 60);

    // Validate result is reasonable (latitude: -90 to 90, longitude: -180 to 180)
    if (Math.abs(decimalDegrees) > 180) {
      console.warn('Invalid GPS coordinate:', { coordinate, degree, result: decimalDegrees });
      return undefined;
    }

    return decimalDegrees;
  } catch (error) {
    console.error('Error converting GPS coordinate:', error, { coordinate, degree });
    return undefined;
  }
}

/**
 * Convert GPS coordinates object for Google Maps
 * @param data - Object containing GPS data
 * @returns Object with converted lat/lng or undefined if invalid
 */
export function convertGpsCoordinates(data: {
  latitude?: number;
  latitude_degree?: number;
  longitude?: number;
  longitude_degree?: number;
}): { lat: number; lng: number } | undefined {
  const lat = convertGpsCoordinate(data.latitude, data.latitude_degree);
  const lng = convertGpsCoordinate(data.longitude, data.longitude_degree);
  if (lat === undefined || lng === undefined) {
    return undefined;
  }

  return { lat, lng };
}

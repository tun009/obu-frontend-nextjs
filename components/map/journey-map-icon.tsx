import L from 'leaflet';

// SVG string provided by the user for the journey playback vehicle
/**
 * Creates a Leaflet icon for the journey playback vehicle using a PNG image.
 */
export const createJourneyVehicleIcon = () => {
  const carIconUrl = '/images/cars/car.png';

  const carImageHtml = `<img src="${carIconUrl}" style="width: 24px; height: 24px;" />`;

  return L.divIcon({
    html: carImageHtml,
    className: 'leaflet-custom-icon-container',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

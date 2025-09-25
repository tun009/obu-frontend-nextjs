import L from 'leaflet';

// List of available car images
const carImagePaths = [
  '/images/cars/car.png',
  '/images/cars/car3.png',
  '/images/cars/car2.png',
  '/images/cars/car4.png',
  '/images/cars/car5.png',
  '/images/cars/car6.png',
  '/images/cars/car7.png',
  '/images/cars/car8.png',
  '/images/cars/car9.png',
];


const getIconIndexForDevice = (deviceId: string): number => {
  const hash = deviceId.toString().split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);

  const index = Math.abs(hash) % carImagePaths.length;
  return index;
};


export const createDeviceIcon = (deviceId: string) => {
  const iconIndex = getIconIndexForDevice(deviceId);
  const iconUrl = carImagePaths[iconIndex];

  return L.icon({
    iconUrl: iconUrl,
    iconSize: [32, 32],     // Set the size of the icon to 32x32 pixels
    iconAnchor: [16, 16],   // Set the anchor to the center of the icon for correct rotation
  });
};

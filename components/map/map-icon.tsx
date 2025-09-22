import L from 'leaflet';

const PREDEFINED_COLORS = [
  '#FF5733', 
  '#33FF57', 
  '#3357FF', 
  '#FF33A1', 
  '#A133FF', 
  '#33FFF3', 
  '#FFC300', 
  '#FF8D33',
  '#8D33FF', 
  '#33FF8D', 
];

// Helper to get a color from the predefined list based on device ID
const getColorForDevice = (deviceId: number | string) => {
  // If the ID is a string, create a simple hash from it.
  // If it's a number, use it directly.
  const numericId = typeof deviceId === 'string'
    ? deviceId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    : deviceId;

  const index = Math.abs(numericId) % PREDEFINED_COLORS.length;
  return PREDEFINED_COLORS[index];
};

// The new car SVG string provided by the user
const carSvgString = `
 <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" viewBox="0 0 256 256" xml:space="preserve">
<g style="stroke: none; stroke-width: 0; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: none; fill-rule: nonzero; opacity: 1;" transform="translate(1.4065934065934016 1.4065934065934016) scale(2.81 2.81)">
	<path fill: rgba(0, 214, 18, 1) fill-rule="evenodd"  d="M 85.967 39.984 l -16.273 -3.3 l -9.707 -7.526 c -3.265 -2.53 -7.315 -3.885 -11.433 -3.86 H 30.123 c -4.361 0 -8.49 1.668 -11.628 4.698 l -4.876 4.708 l -9.892 1.551 C 1.567 36.594 0 38.426 0 40.612 V 51.48 c 0 0.829 0.512 1.572 1.287 1.868 l 9.252 3.531 c 0.685 4.198 4.327 7.416 8.716 7.416 c 4.078 0 7.51 -2.779 8.527 -6.54 h 35.807 c 1.016 3.761 4.448 6.54 8.527 6.54 s 7.51 -2.779 8.527 -6.54 h 4.99 c 2.409 0 4.369 -1.96 4.369 -4.37 v -8.468 C 90 42.534 88.304 40.459 85.967 39.984 z" style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill-rule: nonzero; opacity: 1;" transform=" matrix(1 0 0 1 0 0) " stroke-linecap="round"/>
</g>
</svg>
`;

export const createDeviceIcon = (deviceId: string) => {
  const color = getColorForDevice(deviceId);

  // Replace the fill color in the SVG string.
  // The original SVG has `fill: rgba(...)`, which is invalid. We'll replace it with a valid `fill="..."` attribute.
  const iconHtml = carSvgString.replace(/fill: rgba\([^)]+\)/, `fill="${color}"`);

  return L.divIcon({
    html: iconHtml,
    className: 'leaflet-custom-icon-container',
    iconSize: [36, 36],
    iconAnchor: [18, 18], // Center the anchor for a 36x36 icon
  });
};

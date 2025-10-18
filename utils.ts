import type { Coordinates } from './types';

// Coordinates of the Kaaba in Mecca
const KAABA_COORDS: Coordinates = {
  latitude: 21.4225,
  longitude: 39.8262,
};

/**
 * Converts degrees to radians.
 * @param degrees - The angle in degrees.
 * @returns The angle in radians.
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Converts radians to degrees.
 * @param radians - The angle in radians.
 * @returns The angle in degrees.
 */
function toDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

/**
 * Calculates the Qibla direction (bearing) from a given set of coordinates.
 * @param userCoords - The user's current latitude and longitude.
 * @returns The direction of the Qibla in degrees from the geographic North.
 */
export function calculateQiblaDirection(userCoords: Coordinates): number {
  const userLatRad = toRadians(userCoords.latitude);
  const userLonRad = toRadians(userCoords.longitude);
  const kaabaLatRad = toRadians(KAABA_COORDS.latitude);
  const kaabaLonRad = toRadians(KAABA_COORDS.longitude);

  const lonDiff = kaabaLonRad - userLonRad;

  const y = Math.sin(lonDiff) * Math.cos(kaabaLatRad);
  const x =
    Math.cos(userLatRad) * Math.sin(kaabaLatRad) -
    Math.sin(userLatRad) * Math.cos(kaabaLatRad) * Math.cos(lonDiff);

  const initialBearingRad = Math.atan2(y, x);
  const initialBearingDeg = toDegrees(initialBearingRad);

  // Normalize the bearing to be within the range [0, 360)
  return (initialBearingDeg + 360) % 360;
}

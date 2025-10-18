import type { Coordinates } from './types';

// Coordinates of the Kaaba in Mecca (WGS84), with increased precision.
const KAABA_COORDS: Coordinates = {
  latitude: 21.422487,
  longitude: 39.826206,
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
 * This function computes the initial great-circle bearing from the user's
 * location to the Kaaba, measured clockwise from true north.
 * @param userCoords - The user's current latitude and longitude.
 * @returns The direction of the Qibla in degrees from the geographic North.
 */
export function calculateQiblaDirection(userCoords: Coordinates): number {
  const userLatRad = toRadians(userCoords.latitude);      // φ1
  const userLonRad = toRadians(userCoords.longitude);     // λ1
  const kaabaLatRad = toRadians(KAABA_COORDS.latitude);   // φ2
  const kaabaLonRad = toRadians(KAABA_COORDS.longitude);  // λ2

  const lonDiff = kaabaLonRad - userLonRad; // Δλ

  // Formula for bearing using spherical trigonometry.
  // bearing = atan2( sin(Δλ) * cos(φ2), cos(φ1) * sin(φ2) - sin(φ1) * cos(φ2) * cos(Δλ) )
  const y = Math.sin(lonDiff) * Math.cos(kaabaLatRad);
  const x =
    Math.cos(userLatRad) * Math.sin(kaabaLatRad) -
    Math.sin(userLatRad) * Math.cos(kaabaLatRad) * Math.cos(lonDiff);

  const initialBearingRad = Math.atan2(y, x);
  const initialBearingDeg = toDegrees(initialBearingRad);

  // Normalize the bearing to be within the range [0, 360)
  return (initialBearingDeg + 360) % 360;
}

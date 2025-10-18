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
 * Calculates the Qibla direction using a spherical model of the Earth.
 * This serves as a fallback if the more accurate ellipsoidal model fails to converge.
 * @param userCoords The user's current latitude and longitude.
 * @returns The Qibla direction in degrees.
 */
function calculateQiblaDirectionSpherical(userCoords: Coordinates): number {
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

  return (initialBearingDeg + 360) % 360;
}


/**
 * Calculates the Qibla direction (bearing) from a given set of coordinates.
 * This function uses Vincenty's inverse formula on the WGS-84 ellipsoid for
 * high accuracy. It computes the initial great-circle bearing (forward azimuth)
 * from the user's location to the Kaaba, measured clockwise from true north.
 * @param userCoords - The user's current latitude and longitude.
 * @returns The direction of the Qibla in degrees from the geographic North.
 */
export function calculateQiblaDirection(userCoords: Coordinates): number {
    // WGS-84 ellipsoid parameters
    const a = 6378137; // semi-major axis in meters
    const f = 1 / 298.257223563; // flattening

    const phi1 = toRadians(userCoords.latitude);
    const L1 = toRadians(userCoords.longitude);
    const phi2 = toRadians(KAABA_COORDS.latitude);
    const L2 = toRadians(KAABA_COORDS.longitude);

    const L = L2 - L1; // Difference in longitude

    const tanU1 = (1 - f) * Math.tan(phi1);
    const cosU1 = 1 / Math.sqrt(1 + tanU1 * tanU1);
    const sinU1 = tanU1 * cosU1;

    const tanU2 = (1 - f) * Math.tan(phi2);
    const cosU2 = 1 / Math.sqrt(1 + tanU2 * tanU2);
    const sinU2 = tanU2 * cosU2;

    let lambda = L;
    let lambdaP;
    let iterLimit = 100;
    let cosSqAlpha;
    let sinSigma;
    let cos2SigmaM;
    let cosSigma;
    let sigma;

    do {
        const sinLambda = Math.sin(lambda);
        const cosLambda = Math.cos(lambda);
        sinSigma = Math.sqrt(
            Math.pow(cosU2 * sinLambda, 2) +
            Math.pow(cosU1 * sinU2 - sinU1 * cosU2 * cosLambda, 2)
        );
        if (sinSigma === 0) {
            return 0; // co-incident points
        }

        cosSigma = sinU1 * sinU2 + cosU1 * cosU2 * cosLambda;
        sigma = Math.atan2(sinSigma, cosSigma);
        const sinAlpha = (cosU1 * cosU2 * sinLambda) / sinSigma;
        cosSqAlpha = 1 - sinAlpha * sinAlpha;
        
        cos2SigmaM = (cosSqAlpha !== 0) ? (cosSigma - (2 * sinU1 * sinU2) / cosSqAlpha) : 0;

        const C = (f / 16) * cosSqAlpha * (4 + f * (4 - 3 * cosSqAlpha));
        lambdaP = lambda;
        lambda =
            L +
            (1 - C) * f * sinAlpha *
            (sigma + C * sinSigma * (cos2SigmaM + C * cosSigma * (-1 + 2 * Math.pow(cos2SigmaM, 2))));
            
    } while (Math.abs(lambda - lambdaP) > 1e-12 && --iterLimit > 0);

    if (iterLimit === 0) {
        // formula failed to converge, fallback to spherical model
        console.warn("Vincenty's formula did not converge. Falling back to spherical model.");
        return calculateQiblaDirectionSpherical(userCoords);
    }

    const y = cosU2 * Math.sin(lambda);
    const x = cosU1 * sinU2 - sinU1 * cosU2 * Math.cos(lambda);
    const initialBearingRad = Math.atan2(y, x);
    const initialBearingDeg = toDegrees(initialBearingRad);

    // Normalize the bearing to be within the range [0, 360)
    return (initialBearingDeg + 360) % 360;
}

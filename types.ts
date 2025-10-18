
export interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy?: number; // in meters
  altitude?: number; // in meters above sea level
}

export type Theme = 'auto' | 'light' | 'dark';
export type AccuracyMode = 'high' | 'medium' | 'low';

export type GeolocationError = {
    message: string;
    code?: number;
}

import { appConfig } from '@/config/app-config';
import type { Coordinates } from '@/types/domain';

const MAPS_BASE = 'https://www.google.com/maps';

const queryOf = (place: string, coordinates?: Coordinates) =>
  coordinates ? `${coordinates.lat},${coordinates.lng}` : place;

export const googleMapsAdapter = {
  hasEmbed: Boolean(appConfig.googleMapsApiKey),
  searchUrl(place: string, coordinates?: Coordinates) {
    return `${MAPS_BASE}/search/?api=1&query=${encodeURIComponent(queryOf(place, coordinates))}`;
  },
  embedUrl(place: string, coordinates?: Coordinates) {
    return `${MAPS_BASE}/embed/v1/place?key=${encodeURIComponent(appConfig.googleMapsApiKey)}&q=${encodeURIComponent(queryOf(place, coordinates))}`;
  },
  currentPosition() {
    return new Promise<Coordinates>((resolve, reject) => {
      if (!('geolocation' in navigator)) {
        reject(new Error('UNSUPPORTED'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) =>
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }),
        () => reject(new Error('DENIED')),
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 300_000 },
      );
    });
  },
};

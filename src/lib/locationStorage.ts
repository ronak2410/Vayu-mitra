import type { SavedLocation } from '../types/vayumitra';

export const SAVED_LOCATIONS_STORAGE_KEY = 'vayumitra_saved_locations';

/**
 * Adds a location to the saved-cities list if an equivalent entry does not already exist.
 */
export function addSavedLocation(
  list: SavedLocation[],
  loc: { city: string; neighborhood: string; lat: number; lon: number },
  idSuffix: string | number = Date.now()
): SavedLocation[] {
  const exists = list.some(
    (s) =>
      s.city.toLowerCase() === loc.city.toLowerCase() &&
      Math.abs(s.lat - loc.lat) < 0.05 &&
      Math.abs(s.lon - loc.lon) < 0.05
  );
  if (exists) return list;
  return [
    ...list,
    {
      id: `${loc.city.toLowerCase().replace(/\s+/g, '-')}-${idSuffix}`,
      city: loc.city,
      neighborhood: loc.neighborhood,
      lat: loc.lat,
      lon: loc.lon,
    },
  ];
}

/**
 * Removes a saved location by its ID.
 */
export function removeSavedLocation(list: SavedLocation[], id: string): SavedLocation[] {
  return list.filter((loc) => loc.id !== id);
}

/**
 * Safely loads saved locations from a Storage-compatible object, falling back to defaults.
 */
export function loadSavedLocations(
  storage: Pick<Storage, 'getItem'> | undefined,
  fallback: SavedLocation[]
): SavedLocation[] {
  if (!storage) return fallback;
  try {
    const raw = storage.getItem(SAVED_LOCATIONS_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return fallback;
    const valid = parsed.filter(
      (item): item is SavedLocation =>
        Boolean(item) &&
        typeof item.id === 'string' &&
        typeof item.city === 'string' &&
        typeof item.neighborhood === 'string' &&
        typeof item.lat === 'number' &&
        typeof item.lon === 'number'
    );
    return valid;
  } catch {
    return fallback;
  }
}

/**
 * Safely persists saved locations to a Storage-compatible object.
 */
export function persistSavedLocations(
  storage: Pick<Storage, 'setItem'> | undefined,
  list: SavedLocation[]
): boolean {
  if (!storage) return false;
  try {
    storage.setItem(SAVED_LOCATIONS_STORAGE_KEY, JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
}

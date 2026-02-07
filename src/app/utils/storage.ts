// Small localStorage helper with generic getters/setters
export const STORAGE_KEYS = {
  PREFERENCES: 'cinematch_preferences',
  RATED_MOVIES: 'cinematch_rated_movies',
} as const;

export function saveItem<T>(key: string, value: T | null) {
  try {
    if (value === null) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, JSON.stringify(value));
    }
  } catch (e) {
    // localStorage might be unavailable in some environments; ignore failures
    // (Optionally log to console for debugging)
    console.warn('storage.saveItem failed', e);
  }
}

export function getItem<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch (e) {
    console.warn('storage.getItem failed', e);
    return null;
  }
}

export function removeItem(key: string) {
  try {
    localStorage.removeItem(key);
  } catch (e) {
    console.warn('storage.removeItem failed', e);
  }
}

export const DEFAULT_API_URL = 'https://ontrack-api.x10.network/ontrack-api/api';
const LEGACY_API_URL_KEY = 'ontrack_api_url';
const CUSTOM_API_URL_KEY = 'ontrack_custom_api_url';

/**
 * Normalizes a base server URL so it always ends with `/ontrack-api/api`.
 */
export function normalizeApiUrl(rawUrl: string): string {
  let u = rawUrl.trim().replace(/\/+$/, '');
  if (!u.includes('/ontrack-api')) {
    u += '/ontrack-api';
  }
  if (!u.endsWith('/api')) {
    u += '/api';
  }
  return u;
}

/**
 * Resolves the active backend API URL, clearing any stale legacy server override
 * so the hosted live API (`DEFAULT_API_URL`) is used unless explicitly overridden.
 */
export function resolveApiUrl(): string {
  if (typeof window !== 'undefined' && window.localStorage) {
    const legacy = window.localStorage.getItem(LEGACY_API_URL_KEY);
    if (legacy !== null) {
      window.localStorage.removeItem(LEGACY_API_URL_KEY);
      if (legacy.trim() && normalizeApiUrl(legacy) !== DEFAULT_API_URL) {
        window.localStorage.removeItem('ontrack_user_session');
        window.localStorage.removeItem('ontrack_admin_session');
        window.localStorage.removeItem('ontrack_cached_timelogs');
      }
    }
    const custom = window.localStorage.getItem(CUSTOM_API_URL_KEY);
    if (custom && custom.trim()) {
      return normalizeApiUrl(custom);
    }
  }
  return DEFAULT_API_URL;
}

export function getCustomApiUrl(): string | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  const custom = window.localStorage.getItem(CUSTOM_API_URL_KEY);
  return custom && custom.trim() ? normalizeApiUrl(custom) : null;
}

export function saveCustomApiUrl(rawUrl: string): string {
  const normalized = normalizeApiUrl(rawUrl);
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.removeItem(LEGACY_API_URL_KEY);
    window.localStorage.setItem(CUSTOM_API_URL_KEY, normalized);
  }
  return normalized;
}

export function resetCustomApiUrl(): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.removeItem(LEGACY_API_URL_KEY);
    window.localStorage.removeItem(CUSTOM_API_URL_KEY);
  }
}


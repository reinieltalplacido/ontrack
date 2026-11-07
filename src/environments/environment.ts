export const environment = {
  production: false,
  get apiUrl(): string {
    if (typeof window !== 'undefined' && window.localStorage) {
      const custom = window.localStorage.getItem('ontrack_api_url');
      if (custom && custom.trim()) {
        return custom.trim().replace(/\/+$/, '');
      }
    }
    return 'http://localhost/ontrack-api/api';
  },
};

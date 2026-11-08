export const environment = {
  production: false,
  get apiUrl(): string {
    if (typeof window !== 'undefined' && window.localStorage) {
      const custom = window.localStorage.getItem('ontrack_api_url');
      if (custom && custom.trim()) {
        let u = custom.trim().replace(/\/+$/, '');
        if (!u.includes('/ontrack-api')) {
          u += '/ontrack-api';
        }
        if (!u.endsWith('/api')) {
          u += '/api';
        }
        return u;
      }
    }
    return 'https://shy-ducks-lose.loca.lt/ontrack-api/api';
  },
};

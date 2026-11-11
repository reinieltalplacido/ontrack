import { resolveApiUrl } from '../app/core/utils/api-url.util';

export const environment = {
  production: false,
  get apiUrl(): string {
    return resolveApiUrl();
  },
};

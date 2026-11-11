import { resolveApiUrl } from '../app/core/utils/api-url.util';

export const environment = {
  production: true,
  get apiUrl(): string {
    return resolveApiUrl();
  },
};

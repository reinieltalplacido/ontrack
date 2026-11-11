import { TestBed } from '@angular/core/testing';
import { Geolocation, Position } from '@capacitor/geolocation';
import { vi } from 'vitest';

vi.mock('@capacitor/geolocation', () => ({
  Geolocation: {
    getCurrentPosition: vi.fn(),
  },
}));

import { NativeService } from './native.service';

function createPosition(latitude: number, longitude: number): Position {
  return {
    timestamp: Date.now(),
    coords: {
      latitude,
      longitude,
      accuracy: 10,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
      magneticHeading: null,
      trueHeading: null,
      headingAccuracy: null,
      course: null,
    },
  };
}

function createBrowserPosition(latitude: number, longitude: number): GeolocationPosition {
  const coords: GeolocationCoordinates = {
    latitude,
    longitude,
    accuracy: 15,
    altitude: null,
    altitudeAccuracy: null,
    heading: null,
    speed: null,
    toJSON() {
      return {
        latitude: this.latitude,
        longitude: this.longitude,
        accuracy: this.accuracy,
        altitude: this.altitude,
        altitudeAccuracy: this.altitudeAccuracy,
        heading: this.heading,
        speed: this.speed,
      };
    },
  };
  return {
    timestamp: Date.now(),
    coords,
    toJSON() {
      return {
        timestamp: this.timestamp,
        coords: coords.toJSON(),
      };
    },
  };
}

describe('NativeService', () => {
  let service: NativeService;
  let originalGeolocationDescriptor: PropertyDescriptor | undefined;
  const mockGetCurrentPosition = vi.mocked(Geolocation.getCurrentPosition);

  beforeEach(() => {
    originalGeolocationDescriptor =
      Object.getOwnPropertyDescriptor(Navigator.prototype, 'geolocation') ??
      Object.getOwnPropertyDescriptor(navigator, 'geolocation');

    mockGetCurrentPosition.mockReset();

    TestBed.configureTestingModule({
      providers: [NativeService],
    });
    service = TestBed.inject(NativeService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (originalGeolocationDescriptor) {
      Object.defineProperty(navigator, 'geolocation', originalGeolocationDescriptor);
    }
  });

  it('returns live GPS coordinates from Capacitor when available and clears lastLocationError', async () => {
    mockGetCurrentPosition.mockResolvedValue(createPosition(15.489123, 120.975678));

    const result = await service.getCurrentPosition(true);

    expect(result).toEqual({ latitude: 15.489123, longitude: 120.975678, accuracy: 10 });
    expect(service.lastKnownCoords).toEqual({ latitude: 15.489123, longitude: 120.975678, accuracy: 10 });
    expect(service.lastLocationError).toBeNull();
  });

  it('falls back to navigator.geolocation when Capacitor throws', async () => {
    mockGetCurrentPosition.mockRejectedValue(new Error('Capacitor plugin unavailable'));

    const mockBrowserGeo = {
      getCurrentPosition: vi.fn((success: PositionCallback) => {
        success(createBrowserPosition(14.599512, 120.984222));
      }),
    };

    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: mockBrowserGeo,
    });

    const result = await service.getCurrentPosition(true);

    expect(result).toEqual({ latitude: 14.599512, longitude: 120.984222, accuracy: 15 });
    expect(service.lastLocationError).toBeNull();
  });

  it('returns null without hardcoded fallback coordinates when GPS permission is denied', async () => {
    mockGetCurrentPosition.mockRejectedValue({ code: 1, message: 'User denied Geolocation' });

    const mockDeniedBrowserGeo = {
      getCurrentPosition: vi.fn((_success: PositionCallback, error?: PositionErrorCallback | null) => {
        error?.({
          code: 1,
          message: 'User denied Geolocation',
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3,
        });
      }),
    };

    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: mockDeniedBrowserGeo,
    });

    const result = await service.getCurrentPosition(true);

    expect(result).toBeNull();
    expect(service.lastKnownCoords).toBeNull();
    expect(service.lastLocationError).toBe('Location permission denied. Enable GPS permission and tap Refresh.');
  });

  it('reuses cached coordinates unless forceRefresh is true', async () => {
    mockGetCurrentPosition.mockResolvedValue(createPosition(15.5, 120.9));

    await service.getCurrentPosition(false);
    await service.getCurrentPosition(false);
    expect(mockGetCurrentPosition).toHaveBeenCalledTimes(1);

    await service.getCurrentPosition(true);
    expect(mockGetCurrentPosition).toHaveBeenCalledTimes(2);
  });
});

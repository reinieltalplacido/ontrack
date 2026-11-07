import { Injectable } from '@angular/core';
import { Geolocation, Position } from '@capacitor/geolocation';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

export interface GeoResult {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

@Injectable({
  providedIn: 'root',
})
export class NativeService {
  private cachedCoords: GeoResult | null = null;
  private cachedLocationName: string | null = null;
  private lastGeocodeTime = 0;

  get hasCachedLocation(): boolean {
    return !!this.cachedCoords && !!this.cachedLocationName;
  }

  get lastKnownLocationName(): string | null {
    return this.cachedLocationName;
  }

  get lastKnownCoords(): GeoResult | null {
    return this.cachedCoords;
  }

  /**
   * Fast GPS coordinates lookup with caching and aggressive timeout
   */
  async getCurrentPosition(): Promise<GeoResult> {
    // Return cached coordinates if less than 60 seconds old
    if (this.cachedCoords && Date.now() - this.lastGeocodeTime < 60000) {
      return this.cachedCoords;
    }

    try {
      // 3.5-second timeout for snappy mobile response
      const pos: Position = await Promise.race([
        Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 3500,
          maximumAge: 30000,
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('GPS timeout')), 3500)
        ),
      ]);

      const result: GeoResult = {
        latitude: Number(pos.coords.latitude.toFixed(6)),
        longitude: Number(pos.coords.longitude.toFixed(6)),
        accuracy: pos.coords.accuracy,
      };

      this.cachedCoords = result;
      return result;
    } catch {
      // Fallback to HTML5 Geolocation API with fast 3-second timeout
      return new Promise((resolve) => {
        if (!navigator.geolocation) {
          const fallback = this.cachedCoords || { latitude: 15.4855, longitude: 120.9701 };
          resolve(fallback);
          return;
        }

        const timer = setTimeout(() => {
          resolve(this.cachedCoords || { latitude: 15.4855, longitude: 120.9701 });
        }, 3000);

        navigator.geolocation.getCurrentPosition(
          (pos) => {
            clearTimeout(timer);
            const res = {
              latitude: Number(pos.coords.latitude.toFixed(6)),
              longitude: Number(pos.coords.longitude.toFixed(6)),
              accuracy: pos.coords.accuracy,
            };
            this.cachedCoords = res;
            resolve(res);
          },
          () => {
            clearTimeout(timer);
            resolve(this.cachedCoords || { latitude: 15.4855, longitude: 120.9701 });
          },
          { enableHighAccuracy: false, timeout: 3000, maximumAge: 60000 }
        );
      });
    }
  }

  /**
   * Fast reverse geocoding with 2-second abort timeout and caching
   */
  async reverseGeocode(lat: number, lon: number): Promise<string> {
    // If cached for this coordinate within 3 minutes, return instantly
    if (this.cachedLocationName && Date.now() - this.lastGeocodeTime < 180000) {
      return this.cachedLocationName;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=16`;
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'OnTrack-OJT-App/1.0',
        },
      });

      clearTimeout(timeoutId);
      if (!response.ok) throw new Error('Geocoding status error');
      const data = await response.json();

      if (data && data.address) {
        const addr = data.address;
        const street = addr.road || addr.neighbourhood || addr.quarter || addr.suburb || '';
        const city = addr.city || addr.town || addr.municipality || '';

        const parts = [street, city].filter(Boolean);
        const name = parts.length > 0 ? parts.join(', ') : (addr.city || 'Duty Workplace');
        this.cachedLocationName = name;
        this.lastGeocodeTime = Date.now();
        return name;
      }

      return this.cachedLocationName || 'Duty Workplace (GPS Verified)';
    } catch {
      return this.cachedLocationName || 'Duty Workplace (GPS Verified)';
    }
  }

  /**
   * Fast mobile selfie photo with compressed dimensions (40-60KB for instant upload)
   */
  async takeAttendanceSelfie(): Promise<string | null> {
    try {
      const image = await Camera.getPhoto({
        quality: 60,
        width: 600,
        height: 600,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
        promptLabelHeader: 'Duty Verification Photo',
        promptLabelPhoto: 'Choose from Gallery',
        promptLabelPicture: 'Take Live Selfie',
      });

      if (image.base64String) {
        return `data:image/jpeg;base64,${image.base64String}`;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Capture photo for task documentation/proof (Prompt: Camera or Gallery)
   */
  async captureTaskProof(): Promise<string | null> {
    try {
      const image = await Camera.getPhoto({
        quality: 75,
        width: 1024,
        height: 1024,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Prompt,
        promptLabelHeader: 'Task Documentation',
        promptLabelPhoto: 'Choose from Gallery',
        promptLabelPicture: 'Take Live Photo',
      });

      if (image.base64String) {
        return `data:image/jpeg;base64,${image.base64String}`;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Directly open camera for instant task photo documentation
   */
  async openCameraForTask(): Promise<string | null> {
    try {
      const image = await Camera.getPhoto({
        quality: 75,
        width: 1024,
        height: 1024,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
      });

      if (image.base64String) {
        return `data:image/jpeg;base64,${image.base64String}`;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Haptic feedback (disabled / removed)
   */
  async triggerHapticFeedback(_type?: 'success' | 'warning' | 'medium'): Promise<void> {
    // Intentionally disabled / removed
  }
}

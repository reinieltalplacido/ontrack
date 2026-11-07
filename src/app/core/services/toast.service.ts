import { Injectable, inject, signal } from '@angular/core';
import { NativeService } from './native.service';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  title: string;
  duration: number;
  icon?: string;
  actionText?: string;
  actionCallback?: () => void;
  createdAt: number;
}

export interface ToastOptions {
  message: string;
  type?: ToastType;
  title?: string;
  duration?: number;
  icon?: string;
  actionText?: string;
  actionCallback?: () => void;
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private nativeService = inject(NativeService);

  readonly currentToast = signal<ToastItem | null>(null);
  readonly isVisible = signal<boolean>(false);
  private dismissTimer: ReturnType<typeof setTimeout> | null = null;
  private wipeTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * Primary show method supporting simple string calls
   */
  show(
    message: string,
    type: ToastType = 'info',
    duration = 3400
  ): void {
    this.showCustom({ message, type, duration });
  }

  /**
   * Advanced show method supporting custom titles, actions, and icons
   */
  showCustom(options: ToastOptions): void {
    if (!options.message) return;

    const type = options.type || 'info';
    const duration = options.duration !== undefined ? options.duration : 3400;

    // Trigger tactile haptics on supported mobile devices
    try {
      if (type === 'success') {
        this.nativeService.triggerHapticFeedback('success');
      } else if (type === 'error' || type === 'warning') {
        this.nativeService.triggerHapticFeedback('heavy');
      } else {
        this.nativeService.triggerHapticFeedback('light');
      }
    } catch {
      // Haptics safe fallback
    }

    // Clear any pending timers
    if (this.dismissTimer) {
      clearTimeout(this.dismissTimer);
      this.dismissTimer = null;
    }
    if (this.wipeTimer) {
      clearTimeout(this.wipeTimer);
      this.wipeTimer = null;
    }

    const toastItem: ToastItem = {
      id: `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type,
      message: options.message,
      title: options.title || this.getDefaultTitle(type),
      duration,
      icon: options.icon,
      actionText: options.actionText,
      actionCallback: options.actionCallback,
      createdAt: Date.now(),
    };

    this.currentToast.set(toastItem);
    this.isVisible.set(true);

    if (duration > 0) {
      this.dismissTimer = setTimeout(() => {
        this.dismiss();
      }, duration);
    }
  }

  dismiss(): void {
    if (this.dismissTimer) {
      clearTimeout(this.dismissTimer);
      this.dismissTimer = null;
    }

    this.isVisible.set(false);

    // Allow 260ms exit slide-up animation to finish before destroying data
    this.wipeTimer = setTimeout(() => {
      if (!this.isVisible()) {
        this.currentToast.set(null);
      }
    }, 260);
  }

  showSuccess(message: string, duration = 3200, title?: string): void {
    this.showCustom({ message, type: 'success', duration, title });
  }

  showError(message: string, duration = 3800, title?: string): void {
    this.showCustom({ message, type: 'error', duration, title });
  }

  showInfo(message: string, duration = 3200, title?: string): void {
    this.showCustom({ message, type: 'info', duration, title });
  }

  showWarning(message: string, duration = 3500, title?: string): void {
    this.showCustom({ message, type: 'warning', duration, title });
  }

  private getDefaultTitle(type: ToastType): string {
    switch (type) {
      case 'success':
        return 'Success';
      case 'error':
        return 'Alert';
      case 'warning':
        return 'Notice';
      case 'info':
      default:
        return 'OnTrack';
    }
  }
}

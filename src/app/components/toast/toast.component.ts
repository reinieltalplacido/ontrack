import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  checkmarkCircle,
  checkmarkCircleOutline,
  alertCircle,
  alertCircleOutline,
  warning,
  warningOutline,
  informationCircle,
  informationCircleOutline,
  closeOutline,
  closeCircleOutline,
  sparklesOutline,
  arrowForwardOutline,
} from 'ionicons/icons';
import { ToastService, ToastItem } from '../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.scss'],
  standalone: true,
  imports: [CommonModule, IonIcon],
})
export class ToastComponent {
  readonly toastService = inject(ToastService);

  readonly toast = this.toastService.currentToast;
  readonly isVisible = this.toastService.isVisible;

  // Touch gesture handling for swipe up to dismiss
  touchTranslateY = 0;
  private touchStartY = 0;
  private isSwiping = false;

  constructor() {
    addIcons({
      checkmarkCircle,
      checkmarkCircleOutline,
      alertCircle,
      alertCircleOutline,
      warning,
      warningOutline,
      informationCircle,
      informationCircleOutline,
      closeOutline,
      closeCircleOutline,
      sparklesOutline,
      arrowForwardOutline,
    });
  }

  getIconName(item: ToastItem): string {
    if (item.icon) return item.icon;
    switch (item.type) {
      case 'success':
        return 'checkmark-circle';
      case 'error':
        return 'alert-circle';
      case 'warning':
        return 'warning';
      case 'info':
      default:
        return 'information-circle';
    }
  }

  dismiss(event?: MouseEvent | TouchEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.toastService.dismiss();
    this.touchTranslateY = 0;
  }

  onActionClick(event: MouseEvent, item: ToastItem): void {
    event.stopPropagation();
    if (item.actionCallback) {
      item.actionCallback();
    }
    this.toastService.dismiss();
  }

  onToastClick(event: MouseEvent): void {
    // Optional tap to dismiss
    this.dismiss(event);
  }

  // --- Mobile Touch Gestures (Swipe-up to dismiss) ---
  onTouchStart(event: TouchEvent): void {
    if (!event.touches.length) return;
    this.touchStartY = event.touches[0].clientY;
    this.isSwiping = true;
  }

  onTouchMove(event: TouchEvent): void {
    if (!this.isSwiping || !event.touches.length) return;
    const currentY = event.touches[0].clientY;
    const deltaY = currentY - this.touchStartY;

    // Only allow upward swiping gesture
    if (deltaY < 0) {
      this.touchTranslateY = deltaY;
    }
  }

  onTouchEnd(): void {
    if (!this.isSwiping) return;
    this.isSwiping = false;

    // If swiped up more than 28px, dismiss
    if (this.touchTranslateY < -28) {
      this.toastService.dismiss();
    }
    this.touchTranslateY = 0;
  }
}

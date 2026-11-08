import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonFooter,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonNote,
  IonBadge,
  IonChip,
  IonIcon,
  IonProgressBar,
  IonCheckbox,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  locationOutline,
  timeOutline,
  cameraOutline,
  checkmarkCircle,
  checkmarkCircleOutline,
  documentTextOutline,
  arrowForwardOutline,
  checkboxOutline,
  schoolOutline,
  personAddOutline,
  businessOutline,
  peopleOutline,
} from 'ionicons/icons';
import { NativeService } from '../../core/services/native.service';

interface SlideItem {
  tag: string;
  badgeColor: string;
  title: string;
  subtitle: string;
}

@Component({
  selector: 'app-landing',
  templateUrl: './landing.page.html',
  styleUrls: ['./landing.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonFooter,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonList,
    IonItem,
    IonLabel,
    IonNote,
    IonBadge,
    IonChip,
    IonIcon,
    IonProgressBar,
    IonCheckbox,
  ],
})
export class LandingPage {
  private router = inject(Router);
  private nativeService = inject(NativeService);

  currentSlide = 0;
  private touchStartX = 0;
  private touchEndX = 0;

  slides: SlideItem[] = [
    {
      tag: 'Attendance',
      badgeColor: 'primary',
      title: 'Clock In with GPS & Photo',
      subtitle: 'Record daily attendance with workplace coordinates and selfie verification directly from your phone.',
    },
    {
      tag: 'Progress',
      badgeColor: 'success',
      title: 'Automated Hour Computation',
      subtitle: 'Rendered hours calculate automatically each day toward your 486-hour requirement.',
    },
    {
      tag: 'Reports',
      badgeColor: 'secondary',
      title: 'Submission-Ready DTR',
      subtitle: 'Generate formal Daily Time Records and accomplishment summaries formatted for coordinator sign-off.',
    },
    {
      tag: 'Tasks',
      badgeColor: 'warning',
      title: 'Daily Task Management',
      subtitle: 'Organize supervisor-assigned activities and attach accomplishment notes to your daily logs.',
    },
    {
      tag: 'Campuses & Courses',
      badgeColor: 'tertiary',
      title: 'For All Campuses & Programs',
      subtitle: 'Supports all NEUST campuses—from Sumacab to satellite branches—and every college program with auto-linked coordinators.',
    },
  ];

  constructor() {
    addIcons({
      locationOutline,
      timeOutline,
      cameraOutline,
      checkmarkCircle,
      checkmarkCircleOutline,
      documentTextOutline,
      arrowForwardOutline,
      checkboxOutline,
      schoolOutline,
      personAddOutline,
      businessOutline,
      peopleOutline,
    });
  }

  get isLastSlide(): boolean {
    return this.currentSlide === this.slides.length - 1;
  }

  nextSlide() {
    if (this.currentSlide < this.slides.length - 1) {
      this.currentSlide++;
      this.nativeService.triggerHapticFeedback('medium');
    } else {
      this.goToLogin();
    }
  }

  goToSlide(index: number) {
    if (index !== this.currentSlide) {
      this.currentSlide = index;
      this.nativeService.triggerHapticFeedback('medium');
    }
  }

  goToLogin() {
    this.nativeService.triggerHapticFeedback('medium');
    this.router.navigate(['/login']);
  }

  goToRegister() {
    this.nativeService.triggerHapticFeedback('medium');
    this.router.navigate(['/register']);
  }

  onTouchStart(e: TouchEvent) {
    this.touchStartX = e.changedTouches[0].screenX;
  }

  onTouchEnd(e: TouchEvent) {
    this.touchEndX = e.changedTouches[0].screenX;
    const diff = this.touchEndX - this.touchStartX;
    if (diff < -40 && this.currentSlide < this.slides.length - 1) {
      this.currentSlide++;
      this.nativeService.triggerHapticFeedback('medium');
    } else if (diff > 40 && this.currentSlide > 0) {
      this.currentSlide--;
      this.nativeService.triggerHapticFeedback('medium');
    }
  }
}

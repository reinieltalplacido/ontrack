import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonContent,
  IonButton,
  IonIcon,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  clipboardOutline,
  trendingUpOutline,
  documentTextOutline,
  checkboxOutline,
  timeOutline,
  arrowForwardOutline,
  schoolOutline,
  shieldCheckmarkOutline,
  locationOutline,
  cameraOutline,
  checkmarkCircleOutline,
  calendarOutline,
  documentAttachOutline,
  pieChartOutline,
  chevronForwardOutline,
  sparklesOutline,
} from 'ionicons/icons';

interface OnboardingSlide {
  id: number;
  tag: string;
  title: string;
  subtitle: string;
  theme: string;
}

@Component({
  selector: 'app-landing',
  templateUrl: './landing.page.html',
  styleUrls: ['./landing.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonButton,
    IonIcon,
  ],
})
export class LandingPage {
  currentSlide = 0;
  private touchStartX = 0;
  private touchEndX = 0;

  slides: OnboardingSlide[] = [
    {
      id: 0,
      tag: 'Daily Activity Logging',
      title: 'Accurate Time & Attendance',
      subtitle: 'Clock in and out effortlessly with verified workplace GPS coordinates and selfie proof of duty.',
      theme: 'attendance',
    },
    {
      id: 1,
      tag: 'Progress Monitoring',
      title: 'Real-Time Hour Analytics',
      subtitle: 'Track accumulated hours against your target requirement and monitor completion percentage daily.',
      theme: 'progress',
    },
    {
      id: 2,
      tag: 'PDF Reports',
      title: 'Submission-Ready Records',
      subtitle: 'Generate formal Daily Time Records (DTR) and accomplishment summaries ready for coordinator sign-off.',
      theme: 'reports',
    },
    {
      id: 3,
      tag: 'Task Management',
      title: 'Stay on Top of Deliverables',
      subtitle: 'Organize supervisor-assigned tasks, manage subtasks, and meet deadlines with confidence.',
      theme: 'tasks',
    },
  ];

  constructor(private router: Router) {
    addIcons({
      clipboardOutline,
      trendingUpOutline,
      documentTextOutline,
      checkboxOutline,
      timeOutline,
      arrowForwardOutline,
      schoolOutline,
      shieldCheckmarkOutline,
      locationOutline,
      cameraOutline,
      checkmarkCircleOutline,
      calendarOutline,
      documentAttachOutline,
      pieChartOutline,
      chevronForwardOutline,
      sparklesOutline,
    });
  }

  get isLastSlide(): boolean {
    return this.currentSlide === this.slides.length - 1;
  }

  nextSlide() {
    if (this.currentSlide < this.slides.length - 1) {
      this.currentSlide++;
    } else {
      this.goToLogin();
    }
  }

  goToSlide(index: number) {
    this.currentSlide = index;
  }

  skip() {
    this.currentSlide = this.slides.length - 1;
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }

  // Swipe gesture detection
  onTouchStart(e: TouchEvent) {
    this.touchStartX = e.changedTouches[0].screenX;
  }

  onTouchEnd(e: TouchEvent) {
    this.touchEndX = e.changedTouches[0].screenX;
    this.handleSwipe();
  }

  private handleSwipe() {
    const swipeDistance = this.touchEndX - this.touchStartX;
    const threshold = 45;

    if (swipeDistance < -threshold && this.currentSlide < this.slides.length - 1) {
      // Swiped Left -> Next Slide
      this.currentSlide++;
    } else if (swipeDistance > threshold && this.currentSlide > 0) {
      // Swiped Right -> Previous Slide
      this.currentSlide--;
    }
  }
}

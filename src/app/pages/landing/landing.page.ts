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
} from 'ionicons/icons';

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
    });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }
}

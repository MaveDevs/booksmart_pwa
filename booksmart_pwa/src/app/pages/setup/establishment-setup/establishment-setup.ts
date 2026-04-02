import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Auth } from '../../../services/auth/auth';

@Component({
  selector: 'app-establishment-setup',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './establishment-setup.html',
  styleUrl: './establishment-setup.scss'
})
export class EstablishmentSetup implements OnInit {
  constructor(
    private router: Router,
    private authService: Auth,
  ) {}

  ngOnInit(): void {
    const user = this.authService.getUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }
    this.router.navigate(['/app/home'], {
      queryParams: { createBusiness: 1 },
      replaceUrl: true,
    });
  }

  onLogout() {
    this.authService.removeToken();
    this.authService.removeUser();
    this.router.navigate(['/login']);
  }
}

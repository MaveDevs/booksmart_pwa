import { Routes } from '@angular/router';
import { MainLayout } from './components/layout/main-layout/main-layout';
import { authGuard } from './guards/auth.guard';
import { businessSetupGuard } from './guards/business-setup.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  {
    path: 'login',
    loadComponent: () => import('./components/auth/login/login').then(m => m.Login)
  },
  {
    path: 'register',
    loadComponent: () => import('./components/auth/register/register').then(m => m.Register)
  },

  // First-time setup: requires auth, no establishment yet
  {
    path: 'setup',
    canActivate: [authGuard],
    children: [
      {
        path: 'establishment',
        loadComponent: () =>
          import('./pages/setup/establishment-setup/establishment-setup').then(
            m => m.EstablishmentSetup
          )
      },
      { path: '', redirectTo: 'establishment', pathMatch: 'full' }
    ]
  },

  // Main app: requires auth + at least one establishment
  {
    path: 'app',
    component: MainLayout,
    canActivate: [authGuard, businessSetupGuard],
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      {
        path: 'home',
        loadComponent: () => import('./pages/home/home').then(m => m.Home)
      },
      {
        path: 'services',
        loadComponent: () => import('./pages/services/services').then(m => m.Services)
      },
      {
        path: 'agendas',
        loadComponent: () => import('./pages/agendas/agendas').then(m => m.AgendasPage)
      },
      {
        path: 'profile',
        loadComponent: () => import('./pages/profile/profile').then(m => m.Profile)
      }
    ]
  },

  { path: '**', redirectTo: 'login' }
];
import { Routes } from '@angular/router';
import { MainLayout } from './components/layout/main-layout/main-layout';

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
  
  {
    path: 'app',
    component: MainLayout,
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
        path: 'profile', 
        loadComponent: () => import('./pages/profile/profile').then(m => m.Profile) 
      }
    ]
  },
  
  { path: '**', redirectTo: 'login' }
];
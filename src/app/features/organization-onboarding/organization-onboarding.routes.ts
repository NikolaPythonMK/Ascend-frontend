import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'register',
    loadComponent: () =>
      import('./registration/organization-registration.component').then(
        (m) => m.OrganizationRegistrationComponent
      ),
  },
  {
    path: 'setup',
    loadComponent: () =>
      import('./setup/organization-setup.component').then(
        (m) => m.OrganizationSetupComponent
      ),
  },
];

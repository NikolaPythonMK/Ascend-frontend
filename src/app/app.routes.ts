import { Routes } from '@angular/router';
import { EmployeeGuard } from './core/guards/employee.guard';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
    },
    {
        path: 'login',
        loadChildren: () => import('./features/organization-login/organization-login.routes').then((m) => m.routes)
    },
    {
        path: ':organizationId',
        loadComponent: () => import('./features/home/home.component').then((m) => m.HomeComponent),
        canActivate: [EmployeeGuard],
        children: [
            {
                path: 'tables',
                loadComponent: () => import('./features/tables/tables.component').then((m) => m.TablesComponent)
            }
        ]
    },
    {
        path: 'login/:organizationId',
        loadChildren: () => import('./features/employee-login/employee-login.routes').then((m) => m.routes)
    }
    // {
    //     path: 'page-not-found',
    //     loadComponent: () => import('./core/pages/404/not-found.component').then((m) => m.NotFoundPageComponent)
    // },
    // {
    //     path: '**',
    //     redirectTo: 'page-not-found'
    // }
];

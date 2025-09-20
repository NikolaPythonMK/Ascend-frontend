import { Routes } from '@angular/router';
import { EmployeeGuard } from './core/guards/employee.guard';
import { EmployeeLoginGuard } from './features/employee-login/guards/employee-login.guard';
import { permissionsGuard } from './core/guards/permissions.guard';

export const routes: Routes = [
    // {
    //     path: '',
    //     redirectTo: 'login',
    //     pathMatch: 'full'
    // },
    {
        path: 'login',
        loadChildren: () => import('./features/organization-login/organization-login.routes').then((m) => m.routes)
    },
    {
        //path: ':organizationId',
        path: '',
        loadComponent: () => import('./features/home/home.component').then((m) => m.HomeComponent),
        canActivate: [EmployeeGuard],
        children: [
            {
                path: 'tables',
                // canMatch: [permissionsGuard],
                // data: {
                //     requiredPermissions: [{ name: '/api/table/all', method: 'POST' }]
                // },
                loadComponent: () => import('./features/tables/tables.component').then((m) => m.TablesComponent),
            },
            {
                path: 'tables/:table',
                // canMatch: [permissionsGuard],
                // data: {
                //     requiredPermissions: [{ name: '/api/table/id', method: 'POST' }]
                // },
                loadComponent: () => import('./features/tables/components/table/table.component').then((m) => m.TableComponent)
            },
            {
                path: 'personal',
                // canMatch: [permissionsGuard],
                // data: {
                //     requiredPermissions: [{ name: '/api/staff/all', method: 'POST' }]
                // },
                loadComponent: () => import('./features/staff/staff.component').then((m) => m.StaffPage)
            },
            {
                path: 'locations',
                // canMatch: [permissionsGuard],
                // data: {
                //     requiredPermissions: [{ name: '/api/location/all', method: 'POST' }]
                // },
                loadComponent: () => import('./features/locations/locations.component').then((m) => m.LocationsPage)
            },
            {
                path: 'menu',
                // canMatch: [permissionsGuard],
                // data: {
                //     requiredPermissions: [{ name: '/api/product/all', method: 'POST' }]
                // },
                loadComponent: () => import('./features/menu/menu.component').then((m) => m.MenuPage)
            },
            {
                path: 'settings',
                loadComponent: () => import('./features/settings/settings.component').then((m) => m.SettingsPage)
            },
            {
                path: 'tax-details/:id',
                loadComponent: () => import('./features/settings/taxes/pages/tax-details/tax-details.component').then((m) => m.TaxDetailsPage)
            },
            {
                path: 'dynamic-report',
                loadComponent: () => import('./features/reports/dynamic-report.component').then((m) => m.DynamicQueryBuilderComponent)
            },
            {
                path: 'reports-dashboard',
                loadComponent: () => import('./features/reports-dashboard/report-dashboard.component').then((m) => m.DynamicReportsComponent)
            },
            {
                path: 'report-view',
                loadComponent: () => import('./features/report-view/report-view.component').then((m) => m.ReportViewComponent)
            }
        ]
    },
    {
        path: 'staff',
        loadComponent: () => import('./features/employee-login/employee-login.component').then((m) => m.EmployeeLoginComponent),
        canActivate: [EmployeeLoginGuard]
    },
    // {
    //     path: 'page-not-found',
    //     loadComponent: () => import('./core/pages/404/not-found.component').then((m) => m.NotFoundPageComponent)
    // },
    // {
    //     path: '**',
    //     redirectTo: 'page-not-found'
    // }
];

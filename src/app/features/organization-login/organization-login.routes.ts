import { Routes } from "@angular/router";
import { OrganizatoinLoginGuard } from "./guards/organization-login.guard";

export const routes: Routes = [
        {
            path: '',
            canActivate: [OrganizatoinLoginGuard],
            loadComponent: () => import('./organization-login.component').then((m) => m.OrganizationLoginPage)
        },
]
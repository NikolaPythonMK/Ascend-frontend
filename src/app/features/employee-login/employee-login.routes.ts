import { Routes } from "@angular/router";
import { EmployeeLoginGuard } from "./guards/employee-login.guard";

export const routes: Routes = [
        {
            path: '',
            canActivate: [EmployeeLoginGuard],
            loadComponent: () => import ('./employee-login.component').then((m) => m.EmployeeLoginComponent),
        }
]
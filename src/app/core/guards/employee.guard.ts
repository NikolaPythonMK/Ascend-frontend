import { inject, Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, CanActivate, GuardResult, MaybeAsync, Router, RouterStateSnapshot } from "@angular/router";
import { EmployeeStore } from "../store/employee.store";
import { OrganizationService } from "../services/api/organization.service";


@Injectable({
    providedIn: 'root'
})
export class EmployeeGuard implements CanActivate {

    employeeStore = inject(EmployeeStore);
    organizationService = inject(OrganizationService);
    router = inject(Router);

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): MaybeAsync<GuardResult> {
        if (!this.organizationService.isAuthenticated()) {
            return this.router.parseUrl('/login');
        }

        if (!this.employeeStore.hasEmployee()) {
            return this.router.parseUrl('/staff');
        }
        return true;
    }
}
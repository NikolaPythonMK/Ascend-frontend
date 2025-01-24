import { inject, Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, CanActivate, GuardResult, MaybeAsync, Router, RouterStateSnapshot } from "@angular/router";
import { EmployeeStore } from "../../../core/store/employee.store";
import { OrganizationService } from "../../../core/services/organization.service";

/**
 * Organization Login Dependency: The employee login page is inaccessible unless the organization has been logged in first.
 * Single Employee Session: Prevent accessing the employee login page if there’s already an active employee session.
 */

@Injectable({
    providedIn: 'root'
})
export class EmployeeLoginGuard implements CanActivate {
    employeeStore = inject(EmployeeStore);
    organizationService = inject(OrganizationService);
    router = inject(Router);

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): MaybeAsync<GuardResult> {
        if (!this.organizationService.isAuthenticated()) {
            return this.router.parseUrl('/login')
        }
        if (this.employeeStore.hasEmployee()) {
            return this.router.parseUrl('/123/tables');
        }
        return true;
    }
}
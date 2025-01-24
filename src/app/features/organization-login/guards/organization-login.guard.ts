import { inject, Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, CanActivate, GuardResult, MaybeAsync, Router, RouterStateSnapshot } from "@angular/router";
import { EmployeeStore } from "../../../core/store/employee.store";
import { OrganizationService } from "../../../core/services/organization.service";

@Injectable({
    providedIn: 'root'
})
export class OrganizatoinLoginGuard implements CanActivate {
    organizationService = inject(OrganizationService);
    employeeStore = inject(EmployeeStore);
    router = inject(Router);
    

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): MaybeAsync<GuardResult> {
        if (this.organizationService.isAuthenticated()) {
            if (this.employeeStore.hasEmployee()) {
                return this.router.parseUrl('/123/tables');
            }
            return this.router.parseUrl('/employee-login');
        }   
        return true;
    }
}
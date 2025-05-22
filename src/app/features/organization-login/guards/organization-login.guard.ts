import { inject, Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, CanActivate, GuardResult, MaybeAsync, Router, RouterStateSnapshot } from "@angular/router";
import { EmployeeStore } from "../../../core/store/employee.store";
import { OrganizationService } from "../../../core/services/api/organization.service";
import { catchError, map, Observable, of } from "rxjs";

@Injectable({
    providedIn: 'root'
})
export class OrganizatoinLoginGuard implements CanActivate {
    organizationService = inject(OrganizationService);
    employeeStore = inject(EmployeeStore);
    router = inject(Router);

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<GuardResult> {
      return this.organizationService.isAuthenticated()
        .pipe(
          map(result => {
            if (result) {
              if (this.employeeStore.hasEmployee())
                return this.router.parseUrl('/tables');
              return this.router.parseUrl('/staff');
            } else {
              return true;
            }
          }),
          catchError(() => of(true))
        )
    }
}
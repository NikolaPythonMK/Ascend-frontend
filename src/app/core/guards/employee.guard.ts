import { inject, Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  GuardResult,
  MaybeAsync,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { EmployeeStore } from '../store/employee.store';
import { OrganizationService } from '../services/api/organization.service';
import { map, catchError, of, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class EmployeeGuard implements CanActivate {
  employeeStore = inject(EmployeeStore);
  organizationService = inject(OrganizationService);
  router = inject(Router);

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<GuardResult> {
    console.log('EMP GUARD');
    return this.organizationService.isAuthenticated().pipe(
      map((result) => {
        console.log('result: ', result);
        console.log('staff: ', this.employeeStore.hasEmployee())
        if (!result)
            return this.router.parseUrl('/login');
        if (!this.employeeStore.hasEmployee())
            return this.router.parseUrl('/staff');
        return true;
      }),
      catchError((err) => {
        console.log('ERROR: ', err);
        return of(true);
      })
    );
  }
}

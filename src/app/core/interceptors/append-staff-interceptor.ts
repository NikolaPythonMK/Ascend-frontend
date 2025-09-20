import { inject, Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpInterceptor,
  HttpHandler,
  HttpRequest,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { EmployeeStore } from '../store/employee.store';

@Injectable()
export class StaffIdInterceptor implements HttpInterceptor {
  private readonly staffStore = inject(EmployeeStore);

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    if (req.body) {
      const modifiedReq = req.clone({
        body: {
          ...req.body,
          staffUserID: this.staffStore.id(),
        },
      });
      return next.handle(modifiedReq);
    }
    // If no body, return the original request
    return next.handle(req);
  }
}

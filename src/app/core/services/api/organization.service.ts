import { inject, Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { catchError, Observable, of, switchMap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import type { Organization } from '../../models/api/responses/organization.model';
import type { LoginRequest } from '../../models/api/requests/login.request';
import { LoginResponse } from '../../models/api/responses/login-response';

@Injectable({
  providedIn: 'root',
})
export class OrganizationService {
  private cookieService = inject(CookieService);
  private http = inject(HttpClient);
  private domain = environment.domain;

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.domain}/auth/login`, request, {
      withCredentials: true,
    });
  }

  logout() {
    this.cookieService.delete('.AspNetCore.Identity.Application');
    localStorage.removeItem('organization');
  }

  isAuthenticated(): Observable<boolean> {
    return this.http
      .get<boolean>(`${this.domain}/auth/user/is-authenticated`, {
        withCredentials: true,
      });
  }

  getId(): string | null {
    return localStorage.getItem('organization');
  }
}

import { inject, Injectable } from "@angular/core";
import { LoginRequest } from "../../models/login.request";
import { LoginResponse } from "../../models/login.response";
import { CookieService } from 'ngx-cookie-service';
import { Observable, of, tap, throwError } from "rxjs";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../../../environments/environment";
import { Organization } from "../../models/api/organization.model";


@Injectable({
    providedIn: 'root'
})
export class OrganizationService {
    private cookieService = inject(CookieService)
    private http = inject(HttpClient);
    private domain = environment.domain;

    login(request: LoginRequest): Observable<Organization>{
       return this.http.post<Organization>(`${this.domain}/auth/login`, request, { withCredentials: true })
    }

    logout() {
        this.cookieService.delete('.AspNetCore.Identity.Application');
        localStorage.removeItem('organization');
    }

    isAuthenticated(): boolean { // should I check in backend ?
        return this.cookieService.check('.AspNetCore.Identity.Application');
    }

    getId(): string | null {
        return localStorage.getItem('organization');
    }
}
import { inject, Injectable } from "@angular/core";
import { CookieService } from 'ngx-cookie-service';
import { Observable } from "rxjs";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../../../environments/environment";
import type { Organization } from "../../models/api/responses/organization.model";
import type { LoginRequest } from "../../models/api/requests/login.request";


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
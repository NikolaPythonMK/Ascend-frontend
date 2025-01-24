import { inject, Injectable } from "@angular/core";
import { LoginRequest } from "../models/login.request";
import { LoginResponse } from "../models/login.response";
import { CookieService } from 'ngx-cookie-service';
import { Observable, of, throwError } from "rxjs";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../../environments/environment";


@Injectable({
    providedIn: 'root'
})
export class OrganizationService {
    private cookieService = inject(CookieService)
    private httpClient = inject(HttpClient);
    private domain = environment.domain;

    login(request: LoginRequest, isSuccess?: boolean): Observable<LoginResponse>{
        if (isSuccess) {
            const response: LoginResponse = { session: '1234abced' }
            this.cookieService.set('session', response.session )
            return of(response);
        }
        return throwError(() => new Error('auth.wrong-credentials'));
    }

    logout() {
        this.cookieService.delete('session');
    }

    isAuthenticated(): boolean { // should I check in backend ?
        return this.cookieService.check('session');
    }
}
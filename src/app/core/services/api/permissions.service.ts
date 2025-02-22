import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "../../../../environments/environment";
import { Observable } from "rxjs";
import type { Page } from "../../models/api/page.model";
import type { Permission } from "../../models/api/responses/permission.model";

@Injectable({
    providedIn: 'root'
})
export class PermissionsService {
    private http = inject(HttpClient);
    private domain = environment.domain;

    getAll(): Observable<Page<Permission>> {
        return this.http.post<Page<Permission>>(`${this.domain}/permission/all`, { pge: 0, size: 0 }, {withCredentials: true});
    }
}
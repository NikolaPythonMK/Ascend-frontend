import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "../../../../environments/environment";
import type { Role } from "../../models/api/responses/role.model";
import { RoleRequest } from "../../models/api/requests/role.request";
import { BaseService } from "./base.service";
import { Observable } from "rxjs";
import { LookupModel } from "../../models/api/responses/lookup-model";

@Injectable({
    providedIn: 'root'
})
export class RolesService extends BaseService<Role, RoleRequest> {
    protected override http = inject(HttpClient);
    protected override domain = environment.domain;

    constructor() {
        super('role');
    }
   
    lookUp(): Observable<LookupModel[]> {
        return this.http.post<LookupModel[]>(`${this.domain}/role/lookup`, { }, { withCredentials: true });
    }      
}
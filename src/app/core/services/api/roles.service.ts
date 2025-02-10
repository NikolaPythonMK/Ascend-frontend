import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "../../../../environments/environment";
import { Observable } from "rxjs";
import { Page } from "../../models/api/page.model";
import { Permission } from "../../models/api/permission.model";
import { AddRoleRequest } from "../../../features/staff/models/add-role.request";
import { Role } from "../../models/api/role.model";

@Injectable({
    providedIn: 'root'
})
export class RolesService {
    private http = inject(HttpClient);
    private domain = environment.domain;

    getPermissions(): Observable<Page<Permission>> {
        return this.http.post<Page<Permission>>(`${this.domain}/permission/all`, { pge: 0, size: 0 }, {withCredentials: true});
    }

    getRoles(): Observable<Page<Role>> {
        return this.http.post<Page<Role>>(`${this.domain}/role/all`, {page: 0, size: 0}, { withCredentials: true })
    }

    addRole(request: AddRoleRequest): Observable<any> {
        return this.http.post<any>(`${this.domain}/role/create`, request, {withCredentials: true})
    } 
    
    getById(id: number): Observable<Role>{
        return this.http.post<Role>(`${this.domain}/role/id`, { id }, {withCredentials:true})
    }

}
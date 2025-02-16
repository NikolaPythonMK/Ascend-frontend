import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "../../../../environments/environment";
import { Observable } from "rxjs";
import { Page } from "../../models/api/page.model";
import { StaffUser } from "../../models/api/staff-user.model";
import { StaffUserRequest } from "../../../features/staff/models/staff-user.request";
import { Sort } from "../../ui/table/models/sort.model";
import { SearchTerm } from "../../models/api/search-term.model";
import { BaseService } from "./base.service";


@Injectable({
    providedIn: 'root'
})
export class StaffService extends BaseService<StaffUser> {
    protected override http = inject(HttpClient);
    protected override domain = environment.domain;

    constructor() {
        super('staffuser');
    }

    addStaffUser(request: StaffUserRequest): Observable<StaffUser> {
        return this.http.post<StaffUser>(`${this.domain}/staffuser/create`, request, { withCredentials: true })
    }

    updateStaffUser(request: StaffUserRequest): Observable<StaffUser> {
        return this.http.put<StaffUser>(`${this.domain}/staffuser/update`, request, { withCredentials: true })
    }

    deleteStaffUser(id: number): Observable<number> {
        return this.http.post<number>(`${this.domain}/staffuser/delete`, { id }, {withCredentials: true})
    }
}
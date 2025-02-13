import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "../../../../environments/environment";
import { Observable } from "rxjs";
import { Page } from "../../models/api/page.model";
import { StaffUser } from "../../models/api/staff-user.model";
import { StaffUserRequest } from "../../../features/staff/models/staff-user.request";


@Injectable({
    providedIn: 'root'
})
export class StaffService {
    private http = inject(HttpClient);
    private domain = environment.domain;

    getAll(searchTerm?: string): Observable<Page<StaffUser>> {
        return this.http.post<Page<StaffUser>>(`${this.domain}/staffuser/all`, {}, {withCredentials: true})
    }

    addStaffUser(request: StaffUserRequest): Observable<StaffUser> {
        return this.http.post<StaffUser>(`${this.domain}/staffuser/create`, request, { withCredentials: true })
    }

}
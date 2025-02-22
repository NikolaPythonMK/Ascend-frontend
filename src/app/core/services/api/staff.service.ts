import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "../../../../environments/environment";
import { BaseService } from "./base.service";
import type { StaffUser } from "../../models/api/responses/staff-user.model";
import type { StaffUserRequest } from "../../models/api/requests/staff-user.request";


@Injectable({
    providedIn: 'root'
})
export class StaffService extends BaseService<StaffUser, StaffUserRequest> {
    protected override http = inject(HttpClient);
    protected override domain = environment.domain;

    constructor() {
        super('staffuser');
    }
}
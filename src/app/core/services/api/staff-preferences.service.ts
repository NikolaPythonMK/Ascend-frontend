import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "../../../../environments/environment";
import { BaseService } from "./base.service";
import { StaffPreferences } from "../../models/api/responses/staff-preferences.model";
import { StaffPreferencesRequest } from "../../models/api/requests/staff-preferences.request";

@Injectable({
    providedIn: 'root',
})
export class StaffPreferencesService extends BaseService<StaffPreferences, StaffPreferencesRequest> {
    protected override http = inject(HttpClient);
    protected override domain = environment.domain;

    constructor() {
        super('settings-staff-preferences');
    }
}
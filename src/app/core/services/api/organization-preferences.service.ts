import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "../../../../environments/environment";
import { BaseService } from "./base.service";
import { OrganizationPreferencesRequest } from "../../models/api/requests/organization-preferences.request";
import { OrganizationPreferences } from "../../models/api/responses/organization-preferences.model";

@Injectable({
    providedIn: 'root',
})
export class OrganizationPreferencesService extends BaseService<OrganizationPreferences, OrganizationPreferencesRequest> {
    protected override http = inject(HttpClient);
    protected override domain = environment.domain;

    constructor() {
        super('settings-organization-preferences');
    }
}
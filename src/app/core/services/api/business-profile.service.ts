import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "../../../../environments/environment";
import { BaseService } from "./base.service";
import { BusinessProfile } from "../../models/api/responses/business-profile.model";
import { BusinessProfileRequest } from "../../models/api/requests/business-profile.request";

@Injectable({
    providedIn: 'root',
})
export class BusinessProfileService extends BaseService<BusinessProfile, BusinessProfileRequest> {
    protected override http = inject(HttpClient);
    protected override domain = environment.domain;

    constructor() {
        super('settings-business-profile');
    }
}
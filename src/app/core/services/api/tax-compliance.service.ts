import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "../../../../environments/environment";
import { BaseService } from "./base.service";
import { TaxCompliance } from "../../models/api/responses/tax-compliance.model";
import { TaxComplianceRequest } from "../../models/api/requests/tax-compliance.request";

@Injectable({
    providedIn: 'root',
})
export class TaxComplianceService extends BaseService<TaxCompliance, TaxComplianceRequest> {
    protected override http = inject(HttpClient);
    protected override domain = environment.domain;

    constructor() {
        super('settings-tax-compliance');
    }
}
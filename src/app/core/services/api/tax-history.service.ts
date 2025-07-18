import { inject, Injectable } from "@angular/core";
import { BaseService } from "./base.service";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../../../environments/environment";
import { TaxHistoryRequest } from "../../models/api/requests/tax-history.request";
import { TaxHistory } from "../../models/api/responses/tax-history.model";


@Injectable({
    providedIn: 'root'
})
export class TaxHistoryService extends BaseService<TaxHistory, TaxHistoryRequest> {
    protected override http = inject(HttpClient);
    protected override domain = environment.domain;

    constructor() {
        super('taxhistory');
    }
}
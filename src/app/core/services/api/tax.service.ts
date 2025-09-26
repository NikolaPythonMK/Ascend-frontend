import { inject, Injectable } from "@angular/core";
import { BaseService } from "./base.service";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../../../environments/environment";
import { Tax } from "../../models/api/responses/tax.model";
import { TaxRequest } from "../../models/api/requests/tax.request";
import { Observable } from "rxjs";
import { LookupModel } from "../../models/api/responses/lookup-model";


@Injectable({
    providedIn: 'root'
})
export class TaxService extends BaseService<Tax, TaxRequest> {
    protected override http = inject(HttpClient);
    protected override domain = environment.domain;

    constructor() {
        super('tax');
    }

    lookUp(): Observable<LookupModel[]> {
        return this.http.post<LookupModel[]>(`${this.domain}/tax/lookup`, { }, { withCredentials: true });
    }      
}
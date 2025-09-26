import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "../../../../environments/environment";
import { BaseService } from "./base.service";
import { Discount } from "../../models/api/responses/discount.model";
import { DiscountRequest } from "../../models/api/requests/discount.request";
import { Observable } from "rxjs";
import { LookupModel } from "../../models/api/responses/lookup-model";

@Injectable({
    providedIn: 'root'
})
export class DiscountService extends BaseService<Discount, DiscountRequest> {
    protected override http = inject(HttpClient);
    protected override domain = environment.domain;

    constructor() {
        super('discount');
    }
    
    lookUp(): Observable<LookupModel[]> {
        return this.http.post<LookupModel[]>(`${this.domain}/discount/lookup`, { }, { withCredentials: true });
    }      
}
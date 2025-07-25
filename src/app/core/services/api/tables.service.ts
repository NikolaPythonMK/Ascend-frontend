import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "../../../../environments/environment";
import { Observable, of } from "rxjs";
import type { Table } from "../../models/api/responses/table.model";
import { BaseService } from "./base.service";
import { TableRequest } from "../../models/api/requests/table.request";
import { ApplyDiscountRequest } from "../../models/api/requests/discount.request";

@Injectable({
    providedIn: 'root'
})
export class TablesService extends BaseService<Table, TableRequest> {
    protected override http = inject(HttpClient);
    protected override domain = environment.domain;

    constructor(){
        super('table')
    }

    updateTablePositions(request: TableRequest[]): Observable<number[]> {
        return this.http.post<number[]>(`${this.domain}/table/update-position`, request, { withCredentials: true });
    }

    setTableDiscount(request: ApplyDiscountRequest): Observable<Object>{
         return this.http.post(`${this.domain}/table/apply-discount`, request, { withCredentials: true });
    }
}
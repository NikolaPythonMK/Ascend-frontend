import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "../../../../environments/environment";
import { Observable, of } from "rxjs";
import { tables } from "../../../../environments/db";
import type { Table } from "../../models/api/responses/table.model";
import { BaseService } from "./base.service";
import { TableRequest } from "../../models/api/requests/table.request";

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

    getTables(searchTerm?: string): Observable<Table[]> {
        if(searchTerm) {
            return of(tables.filter(i => i.code.toLocaleLowerCase().includes(searchTerm) || searchTerm.includes(i.code.toLocaleLowerCase())));
        }
        return of(tables);
    }
}
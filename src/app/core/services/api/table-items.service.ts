import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "../../../../environments/environment";
import { Observable, of } from "rxjs";
import type { TableItem } from "../../models/api/responses/table-item.model";
import { BaseService } from "./base.service";
import { TableItemRequest } from "../../models/api/requests/table-item.request";

@Injectable({
    providedIn: 'root'
})
export class TableItemsService extends BaseService<TableItem, TableItemRequest> {
    protected override http = inject(HttpClient);
    protected override domain = environment.domain;

    constructor() {
        super('tableitem');
    }

    getTableItems(tableID: number): Observable<TableItem[]> {
        return of([]);
    }
}
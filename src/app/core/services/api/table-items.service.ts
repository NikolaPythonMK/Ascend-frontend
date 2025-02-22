import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "../../../../environments/environment";
import { Observable, of } from "rxjs";
import { tableItems } from "../../../../environments/db";
import type { TableItem } from "../../models/api/responses/table-item.model";

@Injectable({
    providedIn: 'root'
})
export class TableItemsService {
    private http = inject(HttpClient);
    private domain = environment.domain;

    getTableItems(tableID: number): Observable<TableItem[]> {
        return of(tableItems.filter(i => i.tableID === tableID));
    }
}
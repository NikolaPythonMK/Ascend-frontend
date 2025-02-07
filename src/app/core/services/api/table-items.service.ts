import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "../../../../environments/environment";
import { Observable, of } from "rxjs";
import { TableItem } from "../../models/api/table-item.model";
import { tableItems } from "../../../../environments/db";

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
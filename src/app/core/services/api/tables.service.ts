import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "../../../../environments/environment";
import { Observable, of } from "rxjs";
import { tables } from "../../../../environments/db";
import type { Table } from "../../models/api/responses/table.model";

@Injectable({
    providedIn: 'root'
})
export class TablesService {
    private http = inject(HttpClient);
    private domain = environment.domain;

    getTables(searchTerm?: string): Observable<Table[]> {
        if(searchTerm) {
            return of(tables.filter(i => i.code.toLocaleLowerCase().includes(searchTerm) || searchTerm.includes(i.code.toLocaleLowerCase())));
        }
        return of(tables);
    }
}
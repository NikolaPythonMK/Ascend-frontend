import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "../../../../environments/environment";
import { Observable, of } from "rxjs";
import { Table } from "../../models/api/table.model";
import { tables } from "../../../../environments/db";

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
        //return this.http.get<Table[]>(`${this.domain}/tables/`, { withCredentials: true })
    }
}
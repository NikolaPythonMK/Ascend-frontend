import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { Page } from "../../models/api/page.model";
import { SearchTerm } from "../../models/api/search-term.model";
import { environment } from "../../../../environments/environment";
import { Sort } from "../../ui/table/models/sort.model";

@Injectable({
    providedIn: 'root'
})
export abstract class BaseService<T> {
    protected readonly http = inject(HttpClient);
    protected readonly domain = environment.domain;

    constructor(private endpoint: string) {}

    getAll(searchTerm?: SearchTerm[], sort?: Sort): Observable<Page<T>> {
        const filters: any = {};

        if (searchTerm) {
            filters.searchTerm = searchTerm;
        }

        if (sort) {
            filters.sort = [sort];
        }

        return this.http.post<Page<T>>(`${this.domain}/${this.endpoint}/all`, filters, { withCredentials: true });
    }
}
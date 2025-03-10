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
export abstract class BaseService<TRes, TReq> {
    protected readonly http = inject(HttpClient);
    protected readonly domain = environment.domain;

    constructor(private endpoint: string) {}

    getAll(searchTerm?: SearchTerm[], sort?: Sort): Observable<Page<TRes>> {
        const filters: any = {};

        if (searchTerm) {
            filters.searchTerm = searchTerm;
        }

        if (sort) {
            filters.sort = [sort];
        }

        return this.http.post<Page<TRes>>(`${this.domain}/${this.endpoint}/all`, filters, { withCredentials: true });
    }

    getById(id: number): Observable<TRes> {
        return this.http.post<TRes>(`${this.domain}/${this.endpoint}/id`, { id }, { withCredentials: true })
    }

    add(request: TReq | FormData): Observable<TRes> {
        return this.http.post<TRes>(`${this.domain}/${this.endpoint}/create`, request, { withCredentials: true })
    }

    update(request: TReq | FormData): Observable<TRes> {
        return this.http.put<TRes>(`${this.domain}/${this.endpoint}/update`, request, { withCredentials: true })
    }

    delete(id: number): Observable<number> {
        return this.http.post<number>(`${this.domain}/${this.endpoint}/delete`, { id }, { withCredentials: true })
    }
}
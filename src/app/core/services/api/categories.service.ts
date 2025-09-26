import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "../../../../environments/environment";
import { BaseService } from "./base.service";
import type { CategoryRequest } from "../../models/api/requests/category.request";
import { Category } from "../../models/api/responses/category.model";
import { Observable } from "rxjs";
import { LookupModel } from "../../models/api/responses/lookup-model";

@Injectable({
    providedIn: 'root'
})
export class CategoriesService extends BaseService<Category, CategoryRequest> {
    protected override http = inject(HttpClient);
    protected override domain = environment.domain;

    constructor() {
        super('category');
    }

    lookUp(): Observable<LookupModel[]> {
        return this.http.post<LookupModel[]>(`${this.domain}/category/lookup`, { }, { withCredentials: true });
    }    
}
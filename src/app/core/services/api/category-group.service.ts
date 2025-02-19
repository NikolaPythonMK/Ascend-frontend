import { inject, Injectable } from "@angular/core";
import { BaseService } from "./base.service";
import type { CategoryGroup } from "../../models/api/category-group.model";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../../../environments/environment";
import { CategoryGroupRequset } from "../../../features/menu/models/category-group.request";
import { Observable } from "rxjs";

@Injectable({
    providedIn: 'root'
})
export class CategoryGroupService extends BaseService<CategoryGroup> {
    protected override http = inject(HttpClient);
    protected override domain = environment.domain;

    constructor() {
        super('categorygroup');
    }

    addCategoryGroup(request: CategoryGroupRequset): Observable<CategoryGroup> {
        return this.http.post<CategoryGroup>(`${this.domain}/categorygroup/create`, request, { withCredentials: true })
    }

    updateCategoryGroup(request: CategoryGroupRequset): Observable<CategoryGroup> {
        return this.http.put<CategoryGroup>(`${this.domain}/categorygroup/update`, request, { withCredentials: true })
    }

    deleteCategoryGroup(id: number): Observable<number> {
        return this.http.post<number>(`${this.domain}/categorygroup/create`, { id }, { withCredentials: true })
    }
}
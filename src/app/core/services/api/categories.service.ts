import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "../../../../environments/environment";
import { Observable } from "rxjs";
import { Category } from "../../models/api/category.model";
import { BaseService } from "./base.service";
import type { AddCategoryRequest } from "../../../features/menu/models/add-category.request";
import type { UpdateCategoryRequest } from "../../../features/menu/models/update-category.request";

@Injectable({
    providedIn: 'root'
})
export class CategoriesService extends BaseService<Category> {
    protected override http = inject(HttpClient);
    protected override domain = environment.domain;

    constructor() {
        super('category');
    }

    addCategory(request: AddCategoryRequest): Observable<Category> {
        return this.http.post<Category>(`${this.domain}/categorygroup/create`, request, { withCredentials: true })
    }
    
    updateCategory(request: UpdateCategoryRequest): Observable<Category> {
        return this.http.put<Category>(`${this.domain}/categorygroup/update`, request, { withCredentials: true })
    }
    
    deleteCategory(id: number): Observable<number> {
        return this.http.post<number>(`${this.domain}/categorygroup/create`, { id }, { withCredentials: true })
    }
}
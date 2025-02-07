import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "../../../../environments/environment";
import { Observable, of } from "rxjs";
import { Category } from "../../models/api/category.model";
import { categories } from "../../../../environments/db";

@Injectable({
    providedIn: 'root'
})
export class CategoriesService {
    private http = inject(HttpClient);
    private domain = environment.domain;

    getAll(): Observable<Category[]> {
        return of(categories);
    }
}
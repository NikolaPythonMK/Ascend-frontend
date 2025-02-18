import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "../../../../environments/environment";
import { Observable, of } from "rxjs";
import { Product } from "../../models/api/product.model";
import { products } from "../../../../environments/db";

@Injectable({
    providedIn: 'root',
})
export class ProductsService {
    private http = inject(HttpClient);
    private domain = environment.domain;

    getProducts(searchTerm: string = '', categoryID?: number | null): Observable<Product[]> {
        return of (products);
    }

    getProductsForCategory(categoryId: number): Observable<Product[]> {
        return of(products.filter(i => i.categoryID === categoryId));
    }

    
}
import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "../../../../environments/environment";
import { Observable, of } from "rxjs";
import { products } from "../../../../environments/db";
import type { Product } from "../../models/api/responses/product.model";
import { BaseService } from "./base.service";
import type { ProductRequest } from "../../models/api/requests/product.request";

@Injectable({
    providedIn: 'root',
})
export class ProductsService extends BaseService<Product, ProductRequest> {
    protected override http = inject(HttpClient);
    protected override domain = environment.domain;

    constructor() {
        super('product');
    }

    getProductsByCategory(categoryId: number): Observable<Product[]> {
        return of(products.filter(i => i.categoryID === categoryId));
    }
}
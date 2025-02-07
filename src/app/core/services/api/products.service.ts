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

    getProducts(searchTerm: string = '', categoryID: number | null): Observable<Product[]> {
        let filteredProducts = products;
        if (categoryID) {
            filteredProducts = filteredProducts.filter(i => i.categoryID === categoryID);
        }
        return of (filteredProducts.filter(i => i.name.toLocaleLowerCase().includes(searchTerm) ||
                                                i.code.includes(searchTerm) ||
                                                searchTerm.includes(i.name.toLocaleLowerCase())))
    }

    
}
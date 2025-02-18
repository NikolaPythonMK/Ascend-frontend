import { Component, inject, OnInit, signal } from "@angular/core";
import { Category } from "../../../../core/models/api/category.model";
import { environment } from "../../../../../environments/environment";
import { CategoriesService } from "../../../../core/services/api/categories.service";
import { HttpErrorResponse } from "@angular/common/http";
import { ProductsService } from "../../../../core/services/api/products.service";
import { Product } from "../../../../core/models/api/product.model";
import { CommonModule } from "@angular/common";
import {MatCardModule} from '@angular/material/card';
import { SearchBarComponent } from "../../../../core/ui/search-bar/search-bar.component";
import { ButtonComponent } from "../../../../core/ui/button/button.component";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { FormControl, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { HeaderCounterComponent } from "../../../../core/ui/header-counter/header-counter.component";




@Component({
    selector: 'products-component',
    imports: [CommonModule, MatCardModule, SearchBarComponent, ButtonComponent, MatFormFieldModule, MatSelectModule, FormsModule, ReactiveFormsModule, HeaderCounterComponent],
    templateUrl: 'products.component.html',
    styleUrls: ['products.component.scss']
})
export class ProuctsComponent implements OnInit{
    private readonly categoryService = inject(CategoriesService);
    private readonly productService = inject(ProductsService);
    categories = signal<Category[]>([]);
    products = signal<Product[]>([]);

    selectedCategoryId = signal<number | null>(null);
    searchTerm = signal<string>('');

    categoryGroups = new FormControl('');
    categoryGroupsList: string[] = ['Drinks', 'Breakfast', 'Dinner'];

    ngOnInit(): void {
        this.categoryService.getAll().subscribe({
            next: (categories: Category[]) => {
                this.categories.set(categories);
                console.log(categories);
            },
            error: (error: HttpErrorResponse) => {
                console.log(error);
            }
        })

        this.getProducts();
    }

    onSelectCategory(id: number | null): void {
        this.selectedCategoryId.set(id);
        this.getProducts();
    }

    private getProducts(): void {
        this.productService.getProducts(this.searchTerm(), this.selectedCategoryId()).subscribe({
            next: (products: Product[]) => {
                this.products.set(products);
                console.log(this.products());
            },
            error: (error: HttpErrorResponse) => {
                console.log(error);
            }
        })
    }

    
}
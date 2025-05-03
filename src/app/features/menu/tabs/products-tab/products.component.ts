import { Component, computed, inject, OnInit, signal } from "@angular/core";
import type { Category } from "../../../../core/models/api/responses/category.model";
import { environment } from "../../../../../environments/environment";
import { CategoriesService } from "../../../../core/services/api/categories.service";
import { HttpErrorResponse } from "@angular/common/http";
import { ProductsService } from "../../../../core/services/api/products.service";
import type { Product } from "../../../../core/models/api/responses/product.model";
import { CommonModule } from "@angular/common";
import {MatCardModule} from '@angular/material/card';
import { SearchBarComponent } from "../../../../core/ui/search-bar/search-bar.component";
import { ButtonComponent } from "../../../../core/ui/button/button.component";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { FormControl, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { HeaderCounterComponent } from "../../../../core/ui/header-counter/header-counter.component";
import { Page } from "../../../../core/models/api/page.model";
import { CategoryGroupService } from "../../../../core/services/api/category-group.service";
import { CategoryGroup } from "../../../../core/models/api/responses/category-group.model";
import { Card } from "../../../../core/ui/display-cards/models/card.model";
import { ListElement } from "../../../../core/ui/display-list/models/list-element.model";
import { DisplayCardsComponent } from "../../../../core/ui/display-cards/display-cards.component";
import { DisplayListComponent } from "../../../../core/ui/display-list/display-list.component";
import { SnackbarService } from "../../../../core/services/utility/snackbar.service";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { MatDialog } from "@angular/material/dialog";
import { ProductDialog } from "../../dialogs/product/product-dialog.component";
import { ImageService } from "../../../../core/services/utility/image.service";


@Component({
    selector: 'products-component',
    imports: [CommonModule,
              MatCardModule,
              SearchBarComponent,
              ButtonComponent,
              MatFormFieldModule,
              MatSelectModule,
              FormsModule, ReactiveFormsModule, HeaderCounterComponent, DisplayCardsComponent, DisplayListComponent, MatIconModule, MatButtonModule],
    templateUrl: 'products.component.html',
    styleUrls: ['products.component.scss']
})
export class ProuctsComponent implements OnInit{
    private readonly categoryService = inject(CategoriesService);
    private readonly categoryGroupService = inject(CategoryGroupService);
    private readonly productService = inject(ProductsService);
    private readonly snackbarService = inject(SnackbarService);
    private readonly imageService = inject(ImageService);
    private readonly dialog = inject(MatDialog);
    categories = signal<Category[]>([]);
    categoryGroups = signal<CategoryGroup[]>([]);
    products = signal<Product[]>([]);
    selectedCategory = signal<Category | null>(null);

    selectedValue = 0;

    productCards = computed<Card[]>(() => this.products().map(p => {
        return {
            id: p.id,
            title: p.name,
            image: p.image
        }
    }))

    categoryListElements = computed<ListElement[]>(() => this.categories().map(c => {
        return {
            id: c.id,
            title: c.name
        }
    }))

    selectedCategoryId = signal<number | null>(null);
    searchTerm = signal<string>('');

    ngOnInit(): void {

        this.categoryGroupService.getAll().subscribe({
            next: (result: Page<CategoryGroup>) => {
                this.categoryGroups.set(result.data)
            },
            error: (error: HttpErrorResponse) => {
                console.log(error);
            }
        })

        this.getCategories();
        this.getProducts();
    }

    onSelectCategory(id: number | null): void {
        if (!id) {
            this.getProducts();
            return;
        }
        this.categoryService.getById(id).subscribe({
            next: (result: Category) => {
                this.selectedCategory.set(result);
                this.products.set(result.products);
            },
            error: (error: HttpErrorResponse) => {
                this.snackbarService.error(error.message);
            }
        })
    }

    onSelectGroup(id: number) {
        if (id === 0) {
            this.getCategories();
        }
        else {
            this.categoryGroupService.getById(id).subscribe({
                next: (result: CategoryGroup) => {
                    this.categories.set(result.categories);
                },
                error: (error: HttpErrorResponse) => {
                    console.log(error.message);
                }       
            })
        }
    }

    onAddProduct(): void {
        const dialogRef = this.dialog.open(ProductDialog);
        dialogRef.afterClosed().subscribe((result) => {
            if(!result){
                return;
            }
            if (this.selectedCategory()){
                this.categoryService.getById(this.selectedCategory()!.id!).subscribe((result: Category) => {
                    this.products.set(result.products);
                })
            }
            else {
                this.getProducts();
            }
        })
    }

    onProductedit(product: any): void {
        const dialogRef = this.dialog.open(ProductDialog, product);
        dialogRef.afterClosed().subscribe((result) => {
            if(!result){
                return;
            }
            if (this.selectedCategory()){
                this.categoryService.getById(this.selectedCategory()!.id!).subscribe((result: Category) => {
                    this.products.set(result.products);
                })
            }
            else {
                this.getProducts();
            }
        })
    }

    onSearchProducts(searchTerm: string): void {

    }

    private getProducts(): void {
        this.productService.getAll().subscribe({
            next: (products: Page<Product>) => {
                this.products.set(products.data);
            },
            error: (error: HttpErrorResponse) => {
                console.log(error);
            }
        })
    }

    private getCategories(): void {
        this.categoryService.getAll().subscribe({
            next: (categories: Page<Category>) => {
                this.categories.set(categories.data);
            },
            error: (error: HttpErrorResponse) => {
                console.log(error);
            }
        })
    }
}
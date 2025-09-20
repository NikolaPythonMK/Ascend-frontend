import { Component, computed, inject, OnInit, signal } from "@angular/core";
import type { Category } from "../../../../core/models/api/responses/category.model";
import { CategoriesService } from "../../../../core/services/api/categories.service";
import { HttpErrorResponse } from "@angular/common/http";
import { ProductsService } from "../../../../core/services/api/products.service";
import type { Product } from "../../../../core/models/api/responses/product.model";
import { CommonModule } from "@angular/common";
import {MatCardModule} from '@angular/material/card';
import { SearchBarComponent } from "../../../../core/ui/search-bar/search-bar.component";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { HeaderCounterComponent } from "../../../../core/ui/header-counter/header-counter.component";
import { Page } from "../../../../core/models/api/page.model";
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
import { finalize } from "rxjs";
import { SearchTerm } from "../../../../core/models/api/search-term.model";
import { FilterDataService } from "../../../../core/services/utility/filter-data.service";
import { BreakpointService } from "../../../../core/services/utility/breakpoint.service";
import { Filter } from "../../../../core/models/api/value-objects/filter.model";
import { TranslateModule } from "@ngx-translate/core";
import { PermissionService } from "../../../../core/services/auth/permission.service";


@Component({
    selector: 'products-component',
    imports: [CommonModule,
              MatCardModule,
              MatButtonModule,
              SearchBarComponent,
              MatFormFieldModule,
              MatSelectModule,
              TranslateModule,
              FormsModule, ReactiveFormsModule, HeaderCounterComponent, DisplayCardsComponent, DisplayListComponent, MatIconModule, MatButtonModule],
    templateUrl: 'products.component.html',
    styleUrls: ['products.component.scss', '../../styles/tab-style.scss']
})
export class ProuctsComponent implements OnInit{
    private readonly categoryService = inject(CategoriesService);
    private readonly productService = inject(ProductsService);
    private readonly snackbarService = inject(SnackbarService);
    private readonly dialog = inject(MatDialog);
    private readonly filterData = inject(FilterDataService);
    public readonly breakpointService = inject(BreakpointService);
    private authz = inject(PermissionService);
    categories = signal<Category[]>([]);
    categoryGroups = signal<CategoryGroup[]>([]);
    products = signal<Product[]>([]);
    selectedCategory = signal<number>(0);
    productsLoading = signal<boolean>(false);
    categoriesLoading = signal<boolean>(false);

    canCreate = computed(() =>
        this.authz.has({ name: '/api/product/create', method: 'POST' })
    );

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
        this.getProducts();
        if(this.breakpointService.isDesktop()){
            this.getCategories();
        } 
    }

    onAddProduct(): void {
        const dialogRef = this.dialog.open(ProductDialog, {
            data: {
                selectedCategoryId: this.selectedCategory()
            }
        });
        dialogRef.afterClosed().subscribe((result) => {
            if(!result){
                return;
            }
            if (this.selectedCategory()){
                this.onSelectCategoryId(this.selectedCategory())
            }
            else {
                this.getProducts();
            }
        })
    }

    onProductEdit(id: number): void {
        const dialogRef = this.dialog.open(ProductDialog, {
            data: {
                id: id,
                categories: this.categories()
            }
        })
        dialogRef.afterClosed().subscribe((result) => {
            if(!result){
                return;
            }
            if (this.selectedCategory()){
                this.onSelectCategoryId(this.selectedCategory())
            }
            else {
                this.getProducts();
            }
        })
    }

    onSearchProducts(searchTerm: string): void {
        this.searchTerm.set(searchTerm);
        this.getProducts();
    }

    onSelectCategoryId(id: number | null): void {
        if (!id) {
            return;
        }
        this.productsLoading.set(true);
        const filter: Filter = {
            propName: "CategoryID",
            operator: "=",
            value: id.toString()
        };

        this.productService.getAll([], undefined, [filter])
        .pipe(
            finalize(() => this.productsLoading.set(false))
        )
        .subscribe({
            next: (result: Page<Product>) => {
                this.products.set(result.data.map(c => {
                    return {
                        id: c.id,
                        code: c.code,
                        name: c.name,
                        price: c.price,
                        image: c.image,
                        description: c.description
                    } as Product;  
                }));
            },
            error: (error: HttpErrorResponse) => {
                this.snackbarService.error(error.message);
            }
        })
    }

    private getProducts(): void {
        this.productsLoading.set(true);
        const searchFilter: SearchTerm[] = this.filterData.createSearchTermFilter(this.searchTerm(), ['Name;Code'])
        this.productService.getAll(searchFilter)
        .pipe(
            finalize(() => this.productsLoading.set(false))
        )
        .subscribe({
            next: (result: Page<Product>) => {
                this.products.set(result.data.map(c => {
                    return {
                        id: c.id,
                        code: c.code,
                        name: c.name,
                        price: c.price,
                        image: c.image,
                        description: c.description
                    } as Product;  
                }));
            },
            error: (error: HttpErrorResponse) => {
                console.log(error);
            }
        })
    }

    private getCategories(): void {
        this.categoriesLoading.set(true);
        this.categoryService.getAll()
        .pipe(
            finalize(() => this.categoriesLoading.set(false))
        )
        .subscribe({
            next: (categories: Page<Category>) => {
                this.categories.set(categories.data);
            },
            error: (error: HttpErrorResponse) => {
                console.log(error);
            }
        })
    }
}
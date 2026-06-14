import { AfterViewInit, Component, computed, ElementRef, inject, OnDestroy, OnInit, signal, ViewChild } from "@angular/core";
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
import { LookupModel } from "../../../../core/models/api/responses/lookup-model";
import { LoaderComponent } from "../../../../core/ui/loader/loader.component";


@Component({
    selector: 'products-component',
    imports: [CommonModule,
              MatCardModule,
              MatButtonModule,
              SearchBarComponent,
              MatFormFieldModule,
              MatSelectModule,
              TranslateModule,
              FormsModule, ReactiveFormsModule, HeaderCounterComponent, DisplayCardsComponent, DisplayListComponent, MatIconModule, MatButtonModule, LoaderComponent],
    templateUrl: 'products.component.html',
    styleUrls: ['products.component.scss', '../../styles/tab-style.scss']
})
export class ProuctsComponent implements OnInit, AfterViewInit, OnDestroy{
    @ViewChild('productsScrollContainer') private productsScrollContainer?: ElementRef<HTMLElement>;
    @ViewChild('productsScrollSentinel') private productsScrollSentinel?: ElementRef<HTMLElement>;

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
    productsLoadingMore = signal<boolean>(false);
    categoriesLoading = signal<boolean>(false);
    productsPage = signal<number>(0);
    productsPageSize = signal<number>(20);
    totalProducts = signal<number>(0);
    hasMoreProducts = computed(() => this.products().length < this.totalProducts());
    private productsScrollObserver?: IntersectionObserver;
    private productsRequestId = 0;

    canCreate = computed(() =>
        this.authz.has({ name: '/api/product/create', method: 'POST' })
    );

    canUpdate = computed(() =>
        this.authz.has({ name: '/api/product/update', method: 'PUT' })
    );

    canDelete = computed(() =>
        this.authz.has({ name: '/api/product/delete', method: 'POST' })
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

    searchTerm = signal<string>('');

    ngOnInit(): void {
        this.productService.lookUp().subscribe({
            next: (res: LookupModel[]) => {
                console.log('LOOKUP', res);
            },
            error: (error: HttpErrorResponse) => {
                console.log(error);
            }
        })
        this.getProducts();
        if(this.breakpointService.isDesktop()){
            this.getCategories();
        } 
    }

    ngAfterViewInit(): void {
        this.setupProductsInfiniteScroll();
    }

    ngOnDestroy(): void {
        this.productsScrollObserver?.disconnect();
    }

    onAddProduct(): void {
        const dialogRef = this.dialog.open(ProductDialog, {
            data: {
                selectedCategory: this.selectedCategory()
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
                this.reloadProducts();
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
                this.reloadProducts();
            }
        })
    }

    onSearchProducts(searchTerm: string): void {
        this.searchTerm.set(searchTerm);
        this.reloadProducts();
    }

    onSelectCategoryId(id: number | null): void {
        if (id === null) {
            this.selectedCategory.set(0);
            this.reloadProducts();
            return;
        }
        this.selectedCategory.set(id);
        this.reloadProducts();
    }

    private setupProductsInfiniteScroll(): void {
        const root = this.productsScrollContainer?.nativeElement;
        const sentinel = this.productsScrollSentinel?.nativeElement;

        if (!root || !sentinel) {
            return;
        }

        this.productsScrollObserver?.disconnect();
        this.productsScrollObserver = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                this.loadNextProductsPage();
            }
        }, {
            root,
            rootMargin: '160px 0px',
            threshold: 0
        });
        this.productsScrollObserver.observe(sentinel);
    }

    private reloadProducts(): void {
        this.productsPage.set(0);
        this.totalProducts.set(0);
        this.products.set([]);
        this.productsLoadingMore.set(false);
        this.getProducts();
    }

    private loadNextProductsPage(): void {
        if (this.productsLoading() || this.productsLoadingMore() || !this.hasMoreProducts()) {
            return;
        }

        this.productsPage.update((page) => page + 1);
        this.getProducts(true);
    }

    private getProducts(append = false): void {
        const requestId = ++this.productsRequestId;
        if (append) {
            this.productsLoadingMore.set(true);
        } else {
            this.productsLoading.set(true);
        }
        const searchFilter: SearchTerm[] = this.filterData.createSearchTermFilter(this.searchTerm(), ['Name;Code']);
        const filters = this.createProductFilters();

        this.productService.getAll(searchFilter, undefined, filters, this.productsPage(), this.productsPageSize())
        .pipe(
            finalize(() => {
                if (requestId !== this.productsRequestId) {
                    return;
                }

                if (append) {
                    this.productsLoadingMore.set(false);
                } else {
                    this.productsLoading.set(false);
                }
            })
        )
        .subscribe({
            next: (result: Page<Product>) => {
                if (requestId !== this.productsRequestId) {
                    return;
                }

                const products = result.data.map(c => {
                    return {
                        id: c.id,
                        code: c.code,
                        name: c.name,
                        price: c.price,
                        image: c.image,
                        description: c.description
                    } as Product;  
                });

                if (append) {
                    this.products.update((current) => [...current, ...products]);
                } else {
                    this.products.set(products);
                }

                this.totalProducts.set(result.count);
                this.loadNextProductsPageIfNeeded();
            },
            error: (error: HttpErrorResponse) => {
                if (requestId !== this.productsRequestId) {
                    return;
                }

                if (append && requestId === this.productsRequestId) {
                    this.productsPage.update((page) => Math.max(page - 1, 0));
                }
                this.snackbarService.error(error.message);
            }
        })
    }

    private loadNextProductsPageIfNeeded(): void {
        setTimeout(() => {
            const container = this.productsScrollContainer?.nativeElement;
            const sentinel = this.productsScrollSentinel?.nativeElement;

            if (!container || !sentinel || !this.hasMoreProducts()) {
                return;
            }

            const containerRect = container.getBoundingClientRect();
            const sentinelRect = sentinel.getBoundingClientRect();

            if (sentinelRect.top <= containerRect.bottom + 160) {
                this.loadNextProductsPage();
            }
        });
    }

    private createProductFilters(): Filter[] | undefined {
        const selectedCategory = this.selectedCategory();

        if (!selectedCategory) {
            return undefined;
        }

        return [{
            propName: "CategoryID",
            operator: "=",
            value: selectedCategory.toString()
        }];
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

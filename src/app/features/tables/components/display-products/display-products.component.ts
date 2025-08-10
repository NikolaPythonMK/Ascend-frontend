import { Component, ElementRef, inject, Input, input, OnInit, output, signal, ViewChild } from "@angular/core";
import { ProductsService } from "../../../../core/services/api/products.service";
import { CategoriesService } from "../../../../core/services/api/categories.service";
import { CommonModule } from "@angular/common";
import { Category } from "../../../../core/models/api/responses/category.model";
import { Product } from "../../../../core/models/api/responses/product.model";
import { KeyEventEmitter } from "../table/services/key-event-emitter.service";
import { Subject, takeUntil } from "rxjs";


@Component({
    selector: 'display-products',
    imports: [CommonModule],
    templateUrl: 'display-products.component.html',
    styleUrls: ['display-products.component.scss']
})
export class DisplayProductsComponent implements OnInit{
    readonly productsService = inject(ProductsService);
    readonly categoriesService = inject(CategoriesService);
    _products = signal<Product[]>([]);
    @Input()
    set products(products: Product[]) {
        this._products.set(products);
        this.selectedProduct.set(products[0]);
    }
    get products() {
      return this._products();
    }
    keyDown = input<boolean>();
    keyUp = input<boolean>();
    keyEnter = input<boolean>();

    selectedProduct = signal<Product | null>(null);
    selected = output<Product>();
    categories = signal<Category[]>([]);
    totalCounts = signal<number>(0);
    selectedCategoryId = signal<number | null>(null);
    searchTerm = signal<string>('');
    activeProduct = output<Product>();
    loading = input(false);

    keyEventService = inject(KeyEventEmitter)
    private destroy$ = new Subject<void>();

  @ViewChild('productsContainer', { static: true })
    listContainer!: ElementRef<HTMLElement>;

    ngAfterViewInit() {
        this.listContainer.nativeElement.focus();
    }


    ngOnInit(): void {
        this.keyEventService.keys$
        .pipe(takeUntil(this.destroy$))
        .subscribe(value => {
            if (this.selectedProduct() == null)
                this.selectedProduct.set(this.products[0]);

            const products    = this.products;
            const currentIdx  = products.findIndex(i => i.id === this.selectedProduct()?.id);
            const lastIndex   = products.length - 1;

            if (value == 'ArrowUp' && currentIdx > 0) {
                this.selectedProduct.set(products[(currentIdx - 1 + products.length) % products.length]);
                //event.preventDefault();
            }
            if (value == 'ArrowDown' && currentIdx < lastIndex) {
                this.selectedProduct.set(products[(currentIdx + 1) % products.length]);
            }
            if (value == 'Enter') {
                const active = products[currentIdx];
                if (active) this.onActiveProduct(active);
            }

            Promise.resolve().then(() => {
                const container = this.listContainer.nativeElement;
                const sel = container.querySelector<HTMLElement>('.product-card.active');
                if (sel) {
                    sel.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            });
        })
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    onSelectProduct(product: Product): void {
        console.log(product);
        this.selected.emit(product);
    }

    onCategoryChange(event: Event) {
        const selectElement = event.target as HTMLSelectElement;
        const categoryID = parseInt(selectElement.value);

        if (isNaN(categoryID)) {
            this.selectedCategoryId.set(null);
        }
        else {
            this.selectedCategoryId.set(categoryID);
        }
    }

    onSearchTerm(searchTerm: string): void {
        this.searchTerm.set(searchTerm);
    }

    onActiveProduct(product: Product): void {
        this.activeProduct.emit(product);
    }

  /**
   * 
   * A better approach is to limit the scope of the keydown listener to the component's container or a specific element instead of the global window.
   *  For example, you could bind the listener to a wrapper element using the @HostListener on that element.
      Alternatively, Angular's Renderer2 service can be used for attaching and detaching event listeners dynamically, making it more performant and clean
   */

}
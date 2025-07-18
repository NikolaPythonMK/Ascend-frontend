import { Component, HostListener, inject, OnInit, output, signal } from "@angular/core";
import { ProductsService } from "../../../../core/services/api/products.service";
import { HttpErrorResponse } from "@angular/common/http";
import { CategoriesService } from "../../../../core/services/api/categories.service";
import { CommonModule } from "@angular/common";
import { Page } from "../../../../core/models/api/page.model";
import { Category } from "../../../../core/models/api/responses/category.model";
import { Product } from "../../../../core/models/api/responses/product.model";


@Component({
    selector: 'display-products',
    imports: [CommonModule],
    templateUrl: 'display-products.component.html',
    styleUrls: ['display-products.component.scss']
})
export class DisplayProductsComponent implements OnInit{
    readonly productsService = inject(ProductsService);
    readonly categoriesService = inject(CategoriesService);
    products = signal<Product[]>([])
    selectedProductID = signal<number | null>(null);
    categories = signal<Category[]>([]);
    totalCounts = signal<number>(0);
    selectedCategoryId = signal<number | null>(null);
    searchTerm = signal<string>('');
    activeProduct = output<Product>();

    ngOnInit(): void {
        this.getProducts();

        this.categoriesService.getAll().subscribe({
            next: (categories: Page<Category>) => {
                this.categories.set(categories.data);
            },
            error: (error: HttpErrorResponse) => {
                console.log(error);
            }
        })
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
        this.getProducts();
    }

    onSearchTerm(searchTerm: string): void {
        this.searchTerm.set(searchTerm);
        this.getProducts();
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
      @HostListener('window:keydown', ['$event'])  
      handleKeyDown(event: KeyboardEvent) {
        const products = this.products();
        const currentIndex = products.findIndex(i => i.id === this.selectedProductID());
        const lastIndex = products.length - 1;
      
        if (event.key === 'ArrowDown') {
          this.selectedProductID.set(products[(currentIndex + 1) % products.length].id);
        } else if (event.key === 'ArrowUp') {
          this.selectedProductID.set(products[(currentIndex - 1 + products.length) % products.length].id);
        } else if (event.key === 'Enter') {
            const activeProduct = this.products().find(i => i.id === this.selectedProductID());
            this.onActiveProduct(activeProduct!);
        }

        setTimeout(() => {
            const selectedElement = document.querySelector('.selected-product');
            selectedElement?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          });
      }
      
    private getProducts() {
        this.productsService.getAll().subscribe({
            next: (products: Page<Product>) => {
                this.products.set(products.data);
                this.totalCounts.set(products.count);
                this.selectedProductID.set(products.data[0].id);
            },
            error: (error: HttpErrorResponse) => {
                console.log(error);
            }
        })
    }
}
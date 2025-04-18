import { Component, computed, inject, OnInit, signal } from "@angular/core";
import { DisplayListComponent } from "../display-list/display-list.component";
import { MatFormFieldModule, MatLabel } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { Card } from "../../../../core/ui/display-cards/models/card.model";
import { DisplayCardsComponent } from "../../../../core/ui/display-cards/display-cards.component";
import { CategoriesService } from "../../../../core/services/api/categories.service";
import { ProductsService } from "../../../../core/services/api/products.service";
import { SnackbarService } from "../../../../core/services/utility/snackbar.service";
import { HttpErrorResponse } from "@angular/common/http";
import { Page } from "../../../../core/models/api/page.model";
import { Product } from "../../../../core/models/api/responses/product.model";
import { Category } from "../../../../core/models/api/responses/category.model";
import { ImageService } from "../../../../core/services/utility/image.service";
import { ActivatedRoute } from "@angular/router";
import { TablesService } from "../../../../core/services/api/tables.service";
import { Table } from "../../../../core/models/api/responses/table.model";
import { TableItem } from "../../../../core/models/api/responses/table-item.model";
import { TableItemRequest } from "../../../../core/models/api/requests/table-item.request";
import { EmployeeStore } from "../../../../core/store/employee.store";
import { TableItemsService } from "../../../../core/services/api/table-items.service";
import { SearchBarComponent } from "../../../../core/ui/search-bar/search-bar.component";
import { CommonModule } from "@angular/common";
import { MatDialog } from "@angular/material/dialog";
import { ProductQuantityComponent } from "../product-quantity-dialog/product-quantity-dialog.component";


@Component({
    selector: 'table-items',
    imports: [DisplayListComponent, MatFormFieldModule, MatLabel, MatIconModule, DisplayCardsComponent, SearchBarComponent, CommonModule, ProductQuantityComponent],
    templateUrl: 'table.component.html',
    styleUrls: ['table.component.scss']
})
export class TableComponent implements OnInit{
    readonly categoryService = inject(CategoriesService);
    readonly productService = inject(ProductsService);
    readonly tableService = inject(TablesService);
    readonly tableItemsService = inject(TableItemsService);
    readonly snackbarService = inject(SnackbarService);
    readonly imageService = inject(ImageService);
    readonly route = inject(ActivatedRoute);
    readonly staffStore = inject(EmployeeStore);
    readonly quantityDialog = inject(MatDialog);

    tableId = signal<number>(0);
    products = signal<Product[]>([]);
    categories = signal<Category[]>([]);
    tableItems = signal<TableItem[]>([]);
    totalItems = signal<number>(0);
    totalQuantity = signal<number>(0);
    totalPrice = signal<number>(0);
    selectedCategoryId = signal<number | null>(null);
    productCards = computed(() => this.products().map(i => {
        return {
            id: i.id,
            title: i.name,
            image: i.image ? this.imageService.getImageUrl(i.image) : ''
        } as Card
    }))

    ngOnInit(): void {
        this.tableId.set(Number(this.route.snapshot.paramMap.get('table')));
        this.getAllCategories();
        this.getAllProducts();
        console.log(this,this.tableId());
        this.getTableItems();
    }

    onSelectCategory(id: number | null): void {
        if (!id){
            this.getAllProducts();
            return;
        }
        this.getProductsByCategory(id);
    }

    onSelectCard(card: Card): void {
       const dialogRef = this.quantityDialog.open(ProductQuantityComponent, {
            width: '400px',
            data: { card }
       })

       dialogRef.afterClosed().subscribe(result => {
        if (result != null) {
            const request: TableItemRequest = {
                tableID: this.tableId(),
                productID: card.id,
                staffUserID: this.staffStore.id()!,
                quantity: result.quantity,
                note: result.note
            }
            console.log(result);
            this.tableItemsService.add(request).subscribe({
                next: () => {
                    this.getTableItems();
                },
                error: (error: HttpErrorResponse) => {
                    this.snackbarService.error(error.message);
                }
            })
        }
      });
    }

    onIncrementItemQuantity(item: TableItem): void {
        const request = this.createRequest(item.product.id, item.quantity + 1, item.id);
        this.tableItemsService.update(request).subscribe({
            next: () => {
                this.getTableItems();
            },
            error: (error: HttpErrorResponse) => {
                this.snackbarService.error(error.message);
            }
        })
    }

    onDecrementItemQuantity(item: TableItem): void {
        if (item.quantity === 1) {
            this.onRemoveItem(item.id);
            return;
        }

        const request = this.createRequest(item.product.id, item.quantity - 1, item.id);
        this.tableItemsService.update(request).subscribe({
            next: () => {
                this.getTableItems();
            },
            error: (error: HttpErrorResponse) => {
                this.snackbarService.error(error.message);
            }
        })
    }

    onRemoveItem(id: number): void {
        this.tableItemsService.delete(id).subscribe({
            next: () => {
                this.getTableItems();
            },
            error: (error: HttpErrorResponse) => {
                this.snackbarService.error(error.message);
            }
        })
    }

    private createRequest(productId: number, quantity: number, itemId?: number): TableItemRequest {
        return {
            tableID: this.tableId(),
            productID: productId,
            staffUserID: this.staffStore.id()!,
            quantity: quantity,
            ...(itemId ? { id: itemId } : {})
        }
    }

    private getAllProducts(): void {
        this.productService.getAll().subscribe({
            next: (result: Page<Product>) => {
                this.products.set(result.data);
            },
            error: (error: HttpErrorResponse) => {
                this.snackbarService.error(error.message);
            }
        })
    }

    private getProductsByCategory(id: number): void {
        this.categoryService.getById(id).subscribe({
            next: (category: Category) => {
                this.products.set(category.products);
            },
            error: (error: HttpErrorResponse) => {
                this.snackbarService.error(error.message);
            }
        })
    }

    private getAllCategories(): void {
        this.categoryService.getAll().subscribe({
            next: (result: Page<Category>) => {
                this.categories.set(result.data);
            },
            error: (error: HttpErrorResponse) => {
                this.snackbarService.error(error.message);
            }
        })
    }

    private getTableItems(): void {
        this.tableService.getById(this.tableId()).subscribe({
            next: (table: Table) => {
                this.tableItems.set(table.tableItems);
                this.totalItems.set(table.tableItems.length);
                this.totalQuantity.set(table.tableItems.reduce((acc, cur) => acc + cur.quantity, 0));
                this.totalPrice.set(table.totalPrice);
            },
            error: (error: HttpErrorResponse) => {
                this.snackbarService.error(error.message);
            }
        })
    }
}
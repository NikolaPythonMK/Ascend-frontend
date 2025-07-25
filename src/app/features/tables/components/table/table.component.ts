import { Component, computed, DestroyRef, ElementRef, HostListener, inject, OnInit, signal, viewChild } from "@angular/core";
import { DisplayListComponent } from "../display-list/display-list.component";
import { MatFormFieldModule } from "@angular/material/form-field";
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
import { CommonModule } from "@angular/common";
import { MatDialog } from "@angular/material/dialog";
import { ProductQuantityComponent } from "../product-quantity-dialog/product-quantity-dialog.component";
import { debounceTime, distinctUntilChanged, finalize, Subject } from "rxjs";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { SearchTerm } from "../../../../core/models/api/search-term.model";
import { ProductQuantityDialogResponse } from "../../models/product-quantity-dialog-response";
import { LoaderComponent } from "../../../../core/ui/loader/loader.component";
import { BreakpointService } from "../../../../core/services/utility/breakpoint.service";
import { SearchBarComponent } from "../../../../core/ui/search-bar/search-bar.component";
import { Order } from "../../models/order.model";
import { OrderedItemsComponent } from "../ordered-items/ordered-items.component";
import { DisplayProductsComponent } from "../display-products/display-products.component";
import { KeyEventEmitter } from "./services/key-event-emitter.service";

// const PRODUCTS: Product[] = [
//   {
//       id: 1, name: 'Туна сендвич', code: '3243', price: 120,
//       description: "",
//       image: null,
//       categoryID: 0,
//       organizationID: 0
//   },
//   {
//       id: 2, name: 'Пица сендвич', code: '6443', price: 120,
//       description: "",
//       image: null,
//       categoryID: 0,
//       organizationID: 0
//   },
//   {
//       id: 3, name: 'Фанта', code: '1235', price: 120,
//       description: "",
//       image: null,
//       categoryID: 0,
//       organizationID: 0
//   },
//   {
//       id: 4, name: 'Кока кола', code: '8980', price: 120,
//       description: "",
//       image: null,
//       categoryID: 0,
//       organizationID: 0
//   },
//   {
//       id: 5, name: 'Нес кафе', code: '1515', price: 120,
//       description: "",
//       image: null,
//       categoryID: 0,
//       organizationID: 0
//   },
// ];

const ORDERS: Order[] = [
  {
    id: 23,
    totalPrice: 1000,
    paymentMethod: 'cash',
    dateTime: new Date(),
    staffId: 1,
    table: '2',
    status: 1,
    orderItems: [
      { id: 1, orderId: 23, product: { id: 1, name: 'Туна сендвич', code: '3243', price: 120, description: '' }, quantity: 2, price: 100 },
      { id: 2, orderId: 23, product: { id: 1, name: 'Фанта', code: '1443', price: 120, description: '' }, quantity: 1, price: 100 },
      { id: 3, orderId: 23, product: { id: 1, name: 'Нес кафе', code: '1515', price: 120, description: '' }, quantity: 3, price: 100 },
    ],
  },
  {
    id: 2,
    totalPrice: 2500,
    paymentMethod: 'cash',
    dateTime: new Date(),
    staffId: 1,
    table: '2',
    status: 1,
    orderItems: [
      { id: 1, orderId: 2, product: {
          id: 1, name: 'Кока кола', code: '3003', price: 120,
          description: ""
      }, quantity: 1, price: 100 },
      { id: 2, orderId: 2, product: {
          id: 1, name: 'Пица сендвич', code: '1212', price: 120,
          description: ""
      }, quantity: 2, price: 100 },
      { id: 3, orderId: 2, product: {
          id: 1, name: 'Туна сендвич', code: '3243', price: 120,
          description: ""
      }, quantity: 1, price: 100 },
    ],
  },
  {
    id: 15,
    totalPrice: 4325,
    paymentMethod: 'card',
    dateTime: new Date(),
    staffId: 1,
    table: '2',
    status: 1,
    orderItems: [
      { id: 1, orderId: 15, product: {
          id: 1, name: 'Нес кафе', code: '1515', price: 120,
          description: ""
      }, quantity: 2, price: 100 },
      { id: 2, orderId: 15, product: {
          id: 1, name: 'Нес кафе', code: '1515', price: 120,
          description: ""
      }, quantity: 1, price: 100 },
      { id: 3, orderId: 15, product: {
          id: 1, name: 'Туна сендвич', code: '3243', price: 120,
          description: ""
      }, quantity: 1, price: 100 },
    ],
  },
];


@Component({
    selector: 'table-items',
    imports: [DisplayListComponent, MatFormFieldModule, MatIconModule, DisplayCardsComponent, CommonModule, ReactiveFormsModule, LoaderComponent, SearchBarComponent, OrderedItemsComponent, DisplayProductsComponent],
    templateUrl: 'table.component.html',
    styleUrls: ['table.component.scss']
})
export class TableComponent implements OnInit{
  orders = signal(ORDERS);
  selectedOrderId = signal<number | null>(null);
  selectedOrder = computed<Order | undefined>(() => this.orders().find(i => i.id === this.selectedOrderId()));

    readonly categoryService = inject(CategoriesService);
    readonly productService = inject(ProductsService);
    readonly tableService = inject(TablesService);
    readonly tableItemsService = inject(TableItemsService);
    readonly snackbarService = inject(SnackbarService);
    readonly imageService = inject(ImageService);
    readonly route = inject(ActivatedRoute);
    readonly staffStore = inject(EmployeeStore);
    readonly quantityDialog = inject(MatDialog);
    readonly breakpointService = inject(BreakpointService);

    productsLoading = signal<boolean>(false);
    categoriesLoading = signal<boolean>(false);
    tableItemsLoading = signal<boolean>(false);
    dialogLoading = signal<boolean>(false);

    searchTerm = new FormControl('');
    readonly destroyRef = inject(DestroyRef)

    tableId = signal<number>(0);
    tableStatus = signal<string>('');
    products = signal<Product[]>([]);
    categories = signal<Category[]>([]);
    tableItems = signal<TableItem[]>([]);
    totalItems = signal<number>(0);
    totalQuantity = signal<number>(0);
    totalGrossPrice = signal<number>(0);
    totalNetPrice = signal<number>(0);
    totalTaxAmount = signal<number>(0);
    selectedCategoryId = signal<number | null>(null);
    productCards = computed(() => this.products().map(i => {
        return {
            id: i.id,
            title: i.name,
            image: i.image ? i.image : '',
            price: i.price
        } as Card
    }))

    keyEventSubject = inject(KeyEventEmitter);
    searchInput = viewChild<ElementRef>('searchInput');


    ngOnInit(): void {
        this.tableId.set(Number(this.route.snapshot.paramMap.get('table')));
        this.getAllProducts();
        this.getTableItems();

        console.log(this.totalGrossPrice() + "jovan");

        this.searchTerm.valueChanges.pipe(
            debounceTime(300),
            distinctUntilChanged(),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe(value => {
            this.getAllProducts([{propName: 'Name;Code', searchValue: value ?? ''}])
        })
    }

    @HostListener('window:keydown', ['$event'])
    handleKeydown(event: KeyboardEvent) {
         if (/^[A-Za-z0-9]$/.test(event.key)) {
            this.searchInput()?.nativeElement.focus();
         }else {
            this.keyEventSubject.emitKey(event.key);
         }
    }

    onSelectCard(product: any): void {
       this.keyEventSubject.stop(); 
       const dialogRef = this.quantityDialog.open(ProductQuantityComponent, {
            width: '400px',
            data: { title: product.title }
       })
       //this.dialogLoading.set(true);
       dialogRef.afterClosed()
       //.pipe(finalize(() => this.dialogLoading.set(false)))
       .subscribe((result: ProductQuantityDialogResponse) => {
        this.keyEventSubject.start();
        if (result != null) {
            const request: TableItemRequest = {
                tableID: this.tableId(),
                productHistoryID: product.productHistoryID,
                staffUserID: this.staffStore.id()!,
                quantity: result.data.quantity,
                tableDiscountAmount: 50,
                note: result.data.note
            }
            this.tableItemsService.add(request).subscribe({
                next: () => {
                    this.getTableItems();
                    this.snackbarService.success('Успешно е додадена нарачка');
                },
                error: (error: HttpErrorResponse) => {
                    this.snackbarService.error(error.message);
                }
            })
        }
      });
    }

    onOpenItemDetails(item: TableItem): void {
        const dialogRef = this.quantityDialog.open(ProductQuantityComponent, {
            width: '400px',
            data: { id: item.id, title: item.productName }
        });
        dialogRef.afterClosed().subscribe((result: ProductQuantityDialogResponse) => {
            if (!result){
                return;
            }

            if (result.data) {
                const request: TableItemRequest = {
                    id: item.id,
                    tableID: this.tableId(),
                    productHistoryID: item.product.productHistoryID,
                    staffUserID: this.staffStore.id()!,
                    quantity: result.data.quantity,
                    tableDiscountAmount: 50,
                    note: result.data.note
                }
                this.dialogLoading.set(true);
                this.tableItemsService.update(request)
                .pipe(finalize(() => this.dialogLoading.set(false)))
                .subscribe({
                    next: () => {
                        this.getTableItems();
                        this.snackbarService.success('Успешно е ажурирана нарачката');
                    },
                    error: (error: HttpErrorResponse) => {
                        this.snackbarService.error(error.message);
                    }
                })               
            }

            else if (result.operation === 'DELETE') {
                this.dialogLoading.set(true);
                this.tableItemsService.delete(item.id)
                .pipe(finalize(() => this.dialogLoading.set(false)))
                .subscribe({
                    next: () => {
                        this.getTableItems();
                        this.snackbarService.success('Успешно е избришана нарачката');
                    },
                    error: (error: HttpErrorResponse) => {
                        this.snackbarService.error(error.message);
                    }
                })                  
            }        
        })
    }   

    onClearSearch(): void {
        this.searchTerm.setValue('');
    }


    private getAllProducts(searchTerm?: SearchTerm[]): void {
        this.productsLoading.set(true);

        this.productService.getAll(searchTerm).pipe(
            finalize(() => this.productsLoading.set(false))
          ).subscribe({
            next: (result: Page<Product>) => {
              this.products.set(result.data);
            },
            error: (error: HttpErrorResponse) => {
              this.snackbarService.error(error.message);
            }
          });
    }


    private getTableItems(): void {
        this.tableItemsLoading.set(true);
        this.tableService.getById(this.tableId()).pipe(
            finalize(() => this.tableItemsLoading.set(false))
        )
        .subscribe({
            next: (table: Table) => {
                console.log(table);
                this.tableItems.set(table.tableItems);
                this.totalItems.set(table.tableItems.length);
                this.totalQuantity.set(table.tableItems.reduce((acc, cur) => acc + cur.quantity, 0));
                this.totalGrossPrice.set(table.totalGrossPrice);
                this.totalNetPrice.set(table.totalNetPrice);
                this.totalTaxAmount.set(table.totalTaxAmount);
                this.tableStatus.set(table.status);
            },
            error: (error: HttpErrorResponse) => {
                this.snackbarService.error(error.message);
            }
        })
    }
}
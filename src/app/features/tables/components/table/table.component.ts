import {
  Component,
  computed,
  DestroyRef,
  ElementRef,
  HostListener,
  inject,
  OnInit,
  signal,
  ViewChild,
  viewChild,
} from '@angular/core';
import { DisplayListComponent } from '../display-list/display-list.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { Card } from '../../../../core/ui/display-cards/models/card.model';
import { DisplayCardsComponent } from '../../../../core/ui/display-cards/display-cards.component';
import { CategoriesService } from '../../../../core/services/api/categories.service';
import { ProductsService } from '../../../../core/services/api/products.service';
import { SnackbarService } from '../../../../core/services/utility/snackbar.service';
import { HttpErrorResponse } from '@angular/common/http';
import { Page } from '../../../../core/models/api/page.model';
import { Product } from '../../../../core/models/api/responses/product.model';
import { Category } from '../../../../core/models/api/responses/category.model';
import { ImageService } from '../../../../core/services/utility/image.service';
import { ActivatedRoute, Router } from '@angular/router';
import { TablesService } from '../../../../core/services/api/tables.service';
import { Table } from '../../../../core/models/api/responses/table.model';
import { TableItem } from '../../../../core/models/api/responses/table-item.model';
import { TableItemRequest } from '../../../../core/models/api/requests/table-item.request';
import { EmployeeStore } from '../../../../core/store/employee.store';
import { TableItemsService } from '../../../../core/services/api/table-items.service';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { ProductQuantityComponent } from '../product-quantity-dialog/product-quantity-dialog.component';
import { debounceTime, distinctUntilChanged, finalize, Subject } from 'rxjs';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SearchTerm } from '../../../../core/models/api/search-term.model';
import { ProductQuantityDialogResponse } from '../../models/product-quantity-dialog-response';
import { LoaderComponent } from '../../../../core/ui/loader/loader.component';
import { BreakpointService } from '../../../../core/services/utility/breakpoint.service';
import { SearchBarComponent } from '../../../../core/ui/search-bar/search-bar.component';
import { Order } from '../../models/order.model';
import { OrderedItemsComponent } from '../ordered-items/ordered-items.component';
import { DisplayProductsComponent } from '../display-products/display-products.component';
import { KeyEventEmitter } from './services/key-event-emitter.service';
import { ButtonComponent } from '../../../../core/ui/button/button.component';
import { StaffUser } from '../../../../core/models/api/responses/staff-user.model';
import TranslationService from '../../../../core/services/utility/translation.service';
import { ApplyDiscountRequest } from '../../../../core/models/api/requests/discount.request';
import { TransactionService } from '../../../../core/services/api/transaction.service';
import { Transaction } from '../../../../core/models/api/responses/transaction.model';
import { TransactionRequest } from '../../../../core/models/api/requests/transaction.request';
import { TableRequest } from '../../../../core/models/api/requests/table.request';
import { TemporaryTableRequest } from '../../../../core/models/api/requests/temp-table.request';

@Component({
  selector: 'table-items',
  imports: [
    DisplayListComponent,
    MatFormFieldModule,
    MatIconModule,
    DisplayCardsComponent,
    CommonModule,
    ReactiveFormsModule,
    LoaderComponent,
    SearchBarComponent,
    OrderedItemsComponent,
    DisplayProductsComponent,
    ButtonComponent,
    FormsModule
  ],
  templateUrl: 'table.component.html',
  styleUrls: ['table.component.scss'],
})
export class TableComponent implements OnInit {
  selectedOrderId = signal<number | null>(null);

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
  readonly tableStaff = signal<StaffUser | null>(null);
  readonly isDiscountApplied = signal<boolean>(false);
  private readonly translationService = inject(TranslationService);
  private readonly transactionService = inject(TransactionService);
  private readonly router = inject(Router);

  isTemporaryTable = signal<boolean>(false);
  productsLoading = signal<boolean>(false);
  categoriesLoading = signal<boolean>(false);
  tableItemsLoading = signal<boolean>(false);
  dialogLoading = signal<boolean>(false);

  searchTerm = new FormControl('');
  readonly destroyRef = inject(DestroyRef);

  tableId = signal<number>(0);
  discountCode = signal('');
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
  productCards = computed(() =>
    this.products().map((i) => {
      return {
        id: i.id,
        title: i.name,
        image: i.image ? i.image : '',
        price: i.price,
      } as Card;
    })
  );

  labelText = 'Table';
  editing = false;  

  @ViewChild('editInput') editInput!: ElementRef<HTMLInputElement>;

  startEdit() {
    this.editing = true;
    // wait for the input to appear, then focus it
    setTimeout(() => this.editInput.nativeElement.focus());
  }

  finishEdit() {
    this.editing = false;
    // here you could emit an event or call a service to persist the change
  }

  keyEventSubject = inject(KeyEventEmitter);
  searchInput = viewChild<ElementRef>('searchInput');

  ngOnInit(): void {
    this.tableId.set(Number(this.route.snapshot.paramMap.get('table')));
    if (this.tableId() == 0) {
      this.isTemporaryTable.set(true);
    }
    this.getAllProducts();
    if (!this.isTemporaryTable()) {
          this.getTableItems();
    }
    this.searchTerm.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((value) => {
        this.getAllProducts([
          { propName: 'Name;Code', searchValue: value ?? '' },
        ]);
      });

  }

  @HostListener('window:keydown', ['$event'])
  handleKeydown(event: KeyboardEvent) {
    if (this.keyEventSubject.isPaused()) return;

    if (/^[A-Za-z0-9]$/.test(event.key)) {
      this.searchInput()?.nativeElement.focus();
    } else {
      this.keyEventSubject.emitKey(event.key);
    }
  }

  onSelectCard(product: any): void {
    this.keyEventSubject.stop();
    const dialogRef = this.quantityDialog.open(ProductQuantityComponent, {
      width: '400px',
      data: { title: product.title },
    });
    dialogRef
      .afterClosed()
      .subscribe((result: ProductQuantityDialogResponse) => {
        this.keyEventSubject.start();
        if (result != null) {
          const request: TableItemRequest = {
            tableID: this.tableId(),
            productHistoryID: product.productHistoryID,
            staffUserID: this.staffStore.id()!,
            quantity: result.data.quantity,
            note: result.data.note,
          };

          if (this.isTemporaryTable()) {
            const item: TableItem = {
              id: 0,
              product: product,
              productHistoryID: product.productHistoryID,
              quantity: request.quantity,
              totalGrossPrice: request.quantity * product.price,
              productName: product.name,
              note: request.note
            }

            const exists = this.tableItems().findIndex(i => i.product.id == item.product.id)
            console.log(exists);

            if (exists == -1) {
              this.tableItems.set([
              ...this.tableItems(),  // ← spread *old* items
              item                    // ← then add the new one
            ]);
            }
            else {
              var tmp = this.tableItems();
              tmp[exists].quantity += item.quantity;
              tmp[exists].totalGrossPrice = this.tableItems()[exists].quantity * this.tableItems()[exists].product.price;
              console.log(tmp);
              this.tableItems.set(tmp);
            }

            this.totalGrossPrice.set(this.tableItems().reduce((sum, acc) => {return sum + acc.totalGrossPrice}, 0))

            return;
          }

          this.dialogLoading.set(true);
          this.tableItemsService
            .add(request)
            .pipe(finalize(() => this.dialogLoading.set(false)))
            .subscribe({
              next: () => {
                this.getTableItems();
                this.snackbarService.success('Успешно е додадена нарачка');
              },
              error: (error: HttpErrorResponse) => {
                console.log(error);
                this.snackbarService.error(
                  this.translationService.getTranslationForKey(
                    error.error.detail
                  )
                );
              },
            });
          this.resetProducts();
        }
      });
  }

  onOpenItemDetails(item: TableItem): void {
    this.keyEventSubject.stop();
    const dialogRef = this.quantityDialog.open(ProductQuantityComponent, {
      width: '400px',
      data: { id: item.id, title: item.productName },
    });
    dialogRef
      .afterClosed()
      .subscribe((result: ProductQuantityDialogResponse) => {
        this.keyEventSubject.start();
        if (!result) {
          return;
        }

        if (result.data) {
          const request: TableItemRequest = {
            id: item.id,
            tableID: this.tableId(),
            productHistoryID: item.product.productHistoryID,
            staffUserID: this.staffStore.id()!,
            quantity: result.data.quantity,
            note: result.data.note,
          };
          this.dialogLoading.set(true);
          this.tableItemsService
            .update(request)
            .pipe(finalize(() => this.dialogLoading.set(false)))
            .subscribe({
              next: () => {
                this.getTableItems();
                this.snackbarService.success('Успешно е ажурирана нарачката');
              },
              error: (error: HttpErrorResponse) => {
                this.snackbarService.error(error.message);
              },
            });
        } else if (result.operation === 'DELETE') {
          this.dialogLoading.set(true);
          this.tableItemsService
            .delete(item.id)
            .pipe(finalize(() => this.dialogLoading.set(false)))
            .subscribe({
              next: () => {
                this.getTableItems();
                this.snackbarService.success('Успешно е избришана нарачката');
              },
              error: (error: HttpErrorResponse) => {
                this.snackbarService.error(error.message);
              },
            });
        }
      });
  }

  onClearSearch(): void {
    this.searchTerm.setValue('');
  }

  private getAllProducts(searchTerm?: SearchTerm[]): void {
    this.productsLoading.set(true);

    this.productService
      .getAll(searchTerm)
      .pipe(finalize(() => this.productsLoading.set(false)))
      .subscribe({
        next: (result: Page<Product>) => {
          this.products.set(result.data);
        },
        error: (error: HttpErrorResponse) => {
          this.snackbarService.error(error.message);
        },
      });
  }

  codeInputFocus(): void{
    this.keyEventSubject.stop();
  };

  codeInputLoseFocus(): void {
    this.keyEventSubject.start();
  }

  applyDiscount(code: string): void {
    this.tableItemsLoading.set(true);

    const request: ApplyDiscountRequest = {
      tableID: this.tableId(),
      code: code,
    };
    this.tableService
      .setTableDiscount(request)
      .pipe(finalize(() => this.tableItemsLoading.set(false)))
      .subscribe({
        next: () => {
          this.getTableItems();
          this.snackbarService.success('Успешно');
          this.isDiscountApplied.set(true);
        },
        error: (error: HttpErrorResponse) => {
          this.snackbarService.error(error.message);
        },
      });
    this.keyEventSubject.start();
  }

  removeDiscount(code: string): void {
    this.tableItemsLoading.set(true);

    const request: ApplyDiscountRequest = {
      tableID: this.tableId(),
      code: code,
    };
    this.tableService
      .removeTableDiscount(request)
      .pipe(finalize(() => this.tableItemsLoading.set(false)))
      .subscribe({
        next: () => {
          this.getTableItems();
          this.snackbarService.success('Успешно');
          this.isDiscountApplied.set(false);

        },
        error: (error: HttpErrorResponse) => {
          this.snackbarService.error(error.message);
        },
      });
    this.keyEventSubject.start();
  }

  private getTableItems(): void {
    this.tableItemsLoading.set(true);
    this.tableService
      .getById(this.tableId())
      .pipe(finalize(() => this.tableItemsLoading.set(false)))
      .subscribe({
        next: (table: Table) => {
          console.log(table);
          this.tableItems.set(table.tableItems);
          this.totalItems.set(table.tableItems.length);
          this.totalQuantity.set(
            table.tableItems.reduce((acc, cur) => acc + cur.quantity, 0)
          );
          this.totalGrossPrice.set(table.totalGrossPrice);
          this.totalNetPrice.set(table.totalNetPrice);
          this.totalTaxAmount.set(table.totalTaxAmount);
          this.tableStatus.set(table.status);
          this.tableStaff.set(table.staffUser);
          this.discountCode.set(table.discount.code);
          this.isDiscountApplied.set(table.discount.code != null)

        },
        error: (error: HttpErrorResponse) => {
          this.snackbarService.error(error.message);
        },
      });
  }

  private resetProducts(): void {
    this.searchTerm.setValue('');
  }

  createTransaction(): void {
      const request: TransactionRequest = {
          id: this.tableId(),
          paymentMethod: 1,
          timeStamp: new Date().toISOString()
        };
        this.transactionService
          .add(request)
          .pipe(finalize(() => this.tableItemsLoading.set(false)))
          .subscribe({
            next: (transaction: Transaction) => {
              this.router.navigate(['/tables']);
              this.snackbarService.success('Успешно')
            },
            error: (error: HttpErrorResponse) => {
              this.snackbarService.error(error.message);
            },
          });
    }

  createTemporaryTable(): void{
    const request: TemporaryTableRequest = {
      id: 0,
      tableItems: this.tableItems(),
      name: this.labelText,
      code: this.labelText,
      staffUserID: this.staffStore.id()!
      //staffUserID: this.staffStore.id()!,
    }
    this.tableService
          .createTemporaryTable(request)
          .pipe(finalize(() => this.tableItemsLoading.set(false)))
          .subscribe({
            next: () => {
              this.router.navigate(['/tables']);
              this.snackbarService.success('Успешно')
            },
            error: (error: HttpErrorResponse) => {
              this.snackbarService.error(error.message);
            },
    });
  }
}


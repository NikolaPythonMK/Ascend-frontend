import {
  AfterViewInit,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  HostListener,
  inject,
  OnDestroy,
  OnInit,
  signal,
  ViewChild,
  viewChild,
} from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { Card } from '../../../../core/ui/display-cards/models/card.model';
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
import { DisplayProductsComponent } from '../display-products/display-products.component';
import { KeyEventEmitter } from './services/key-event-emitter.service';
import { StaffUser } from '../../../../core/models/api/responses/staff-user.model';
import TranslationService from '../../../../core/services/utility/translation.service';
import { ApplyDiscountRequest } from '../../../../core/models/api/requests/discount.request';
import { TransactionService } from '../../../../core/services/api/transaction.service';
import { Transaction } from '../../../../core/models/api/responses/transaction.model';
import { TransactionRequest } from '../../../../core/models/api/requests/transaction.request';
import { TemporaryTableRequest } from '../../../../core/models/api/requests/temp-table.request';
import { OrganizationPreferencesService } from '../../../../core/services/api/organization-preferences.service';
import { SettingsManagerService } from '../../../../core/services/utility/settings-manager.service';
import { StaffAuthService } from '../../../employee-login/services/staff-auth.service';
import { PermissionService } from '../../../../core/services/auth/permission.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'table-items',
  imports: [
    MatFormFieldModule,
    MatIconModule,
    CommonModule,
    ReactiveFormsModule,
    LoaderComponent,
    DisplayProductsComponent,
    FormsModule,
    TranslateModule
  ],
  templateUrl: 'table.component.html',
  styleUrls: ['table.component.scss'],
})
export class TableComponent implements OnInit, AfterViewInit, OnDestroy {
  selectedOrderId = signal<number | null>(null);
  readonly settingsManager = inject(SettingsManagerService);
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
  private readonly staffAuthService = inject(StaffAuthService);
  private readonly router = inject(Router);
  private readonly authz = inject(PermissionService);

  canUpdateRole = computed(() => this.authz.has({ name: '/api/table/update', method: 'PUT' }));
  canApplyDiscount = computed(() =>
    this.authz.has({ name: '/api/table/apply-discount', method: 'POST' })
  );
  canRemoveDiscount = computed(() =>
    this.authz.has({ name: '/api/table/remove-discount', method: 'POST' })
  );

  isTemporaryTable = signal<boolean>(false);
  productsLoading = signal<boolean>(false);
  productsLoadingMore = signal<boolean>(false);
  categoriesLoading = signal<boolean>(false);
  tableItemsLoading = signal<boolean>(false);
  dialogLoading = signal<boolean>(false);

  searchTerm = new FormControl('');
  readonly destroyRef = inject(DestroyRef);

  tableId = signal<number>(0);
  discountCode = signal('');
  tableStatus = signal<string>('');
  products = signal<Product[]>([]);
  productsPage = signal<number>(1);
  productsPageSize = signal<number>(20);
  totalProducts = signal<number>(0);
  hasMoreProducts = computed(() => this.products().length < this.totalProducts());
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

  tableName = signal<string>('');
  editing = false;  

  @ViewChild('productsScrollContainer') private productsScrollContainer?: ElementRef<HTMLElement>;
  @ViewChild('productsScrollSentinel') private productsScrollSentinel?: ElementRef<HTMLElement>;
  @ViewChild('editInput') editInput!: ElementRef<HTMLInputElement>;
  private productsScrollObserver?: IntersectionObserver;
  private productsRequestId = 0;

  startEdit() {
    if (!this.isTemporaryTable()) return;

    this.editing = true;
    // wait for the input to appear, then focus it
    setTimeout(() => this.editInput.nativeElement.focus());
  }

  finishEdit() {
    this.editing = false;
    this.keyEventSubject.start();
    // here you could emit an event or call a service to persist the change
  }

  keyEventSubject = inject(KeyEventEmitter);
  searchInput = viewChild<ElementRef>('searchInput');

  ngOnInit(): void {
    this.tableId.set(Number(this.route.snapshot.paramMap.get('table')));
    if (this.tableId() == 0) {
      this.isTemporaryTable.set(true);
      this.tableName.set(
        this.translationService.getTranslationForKey('tables.temporary-table')
      );
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
      .subscribe(() => {
        this.reloadProducts();
      });

  }

  ngAfterViewInit(): void {
    this.setupProductsInfiniteScroll();
  }

  ngOnDestroy(): void {
    this.productsScrollObserver?.disconnect();
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
    if (!this.canEditTableValidation()) return;

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
          if (!this.validateQuantity(result.data.quantity)) {
            return;
          }

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
            this.totalItems.set(this.tableItems().length);
            this.totalQuantity.set(this.tableItems().reduce((total, acc) => total + acc.quantity, 0));
            return;
          }

          this.dialogLoading.set(true);
          this.tableItemsService
            .add(request)
            .pipe(finalize(() => this.dialogLoading.set(false)))
            .subscribe({
              next: () => {
                this.getTableItems();
                this.snackbarService.success(
                  this.translationService.getTranslationForKey('tables.messages.item-added')
                );
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
    if (!this.canEditTableValidation()) return;

    this.keyEventSubject.stop();
    const dialogRef = this.quantityDialog.open(ProductQuantityComponent, {
      width: '400px',
      data: {
        id: item.id,
        title: item.productName,
        canDelete: this.settingsManager.canRemoveTableItems(),
      },
    });
    dialogRef
      .afterClosed()
      .subscribe((result: ProductQuantityDialogResponse) => {
        this.keyEventSubject.start();
        if (!result) {
          return;
        }

        if (result.data) {
          if (!this.validateQuantity(result.data.quantity)) {
            return;
          }

          console.log('item', item);
          const productHistoryID = item.productHistoryID ?? item.product?.productHistoryID;
          const request: TableItemRequest = {
            id: item.id,
            tableID: this.tableId(),
            staffUserID: this.staffStore.id()!,
            quantity: result.data.quantity,
            note: result.data.note,
          };

          if (productHistoryID != null) {
            request.productHistoryID = productHistoryID;
          }

          this.dialogLoading.set(true);
          this.tableItemsService
            .update(request)
            .pipe(finalize(() => this.dialogLoading.set(false)))
            .subscribe({
              next: () => {
                this.getTableItems();
                this.snackbarService.success(
                  this.translationService.getTranslationForKey('tables.messages.item-updated')
                );
              },
              error: (error: HttpErrorResponse) => {
                this.snackbarService.error(error.message);
              },
            });
        } else if (result.operation === 'DELETE') {
          if (!this.canRemoveTableItemValidation()) {
            return;
          }

          this.dialogLoading.set(true);
          this.tableItemsService
            .delete(item.id)
            .pipe(finalize(() => this.dialogLoading.set(false)))
            .subscribe({
              next: () => {
                this.getTableItems();
                this.snackbarService.success(
                  this.translationService.getTranslationForKey('tables.messages.item-deleted')
                );
              },
              error: (error: HttpErrorResponse) => {
                this.snackbarService.error(error.message);
              },
            });
        }
      });
  }

  private validateQuantity(quantity: number): boolean {
    if (!Number.isFinite(quantity)) {
      this.snackbarService.error(
        this.translationService.getTranslationForKey('tables.validation.valid-quantity')
      );
      return false;
    }

    if (quantity <= 0) {
      this.snackbarService.error(
        this.translationService.getTranslationForKey('tables.validation.positive-quantity')
      );
      return false;
    }

    return true;
  }

  onClearSearch(): void {
    this.searchTerm.setValue('');
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
    this.productsPage.set(1);
    this.totalProducts.set(0);
    this.products.set([]);
    this.productsLoadingMore.set(false);
    this.getAllProducts();
  }

  private loadNextProductsPage(): void {
    if (this.productsLoading() || this.productsLoadingMore() || !this.hasMoreProducts()) {
      return;
    }

    this.productsPage.update((page) => page + 1);
    this.getAllProducts(true);
  }

  private getAllProducts(append = false): void {
    const requestId = ++this.productsRequestId;

    if (append) {
      this.productsLoadingMore.set(true);
    } else {
      this.productsLoading.set(true);
    }

    this.productService
      .getAll(this.createProductsSearchTerm(), undefined, undefined, this.productsPage(), this.productsPageSize())
      .pipe(finalize(() => {
        if (requestId !== this.productsRequestId) {
          return;
        }

        if (append) {
          this.productsLoadingMore.set(false);
        } else {
          this.productsLoading.set(false);
        }
      }))
      .subscribe({
        next: (result: Page<Product>) => {
          if (requestId !== this.productsRequestId) {
            return;
          }

          if (append) {
            this.products.update((current) => this.appendUniqueProducts(current, result.data));
          } else {
            this.products.set(result.data);
          }

          this.totalProducts.set(result.count);
          this.loadNextProductsPageIfNeeded();
        },
        error: (error: HttpErrorResponse) => {
          if (requestId !== this.productsRequestId) {
            return;
          }

          if (append) {
            this.productsPage.update((page) => Math.max(page - 1, 1));
          }

          this.snackbarService.error(error.message);
        },
      });
  }

  private appendUniqueProducts(current: Product[], next: Product[]): Product[] {
    const existingProductIds = new Set(current.map((product) => product.id));
    const uniqueNextProducts = next.filter((product) => !existingProductIds.has(product.id));

    return [...current, ...uniqueNextProducts];
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

  private createProductsSearchTerm(): SearchTerm[] | undefined {
    const searchValue = this.searchTerm.value?.trim() ?? '';

    if (!searchValue) {
      return undefined;
    }

    return [{ propName: 'Name;Code', searchValue }];
  }

  codeInputFocus(): void{
    this.keyEventSubject.stop();
  };

  codeInputLoseFocus(): void {
    this.keyEventSubject.start();
  }

  applyDiscount(code: string): void {
    if (!this.canApplyDiscount() || !this.canEditTableValidation()) return;
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
          this.snackbarService.success(
            this.translationService.getTranslationForKey('shared.successfully')
          );
          this.isDiscountApplied.set(true);
        },
        error: (error: HttpErrorResponse) => {
          this.snackbarService.error(this.getApiErrorMessage(error));
        },
      });
    this.keyEventSubject.start();
  }

  removeDiscount(code: string): void {
    if (!this.canRemoveDiscount() || !this.canEditTableValidation()) return;
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
          this.snackbarService.success(
            this.translationService.getTranslationForKey('shared.successfully')
          );
          this.isDiscountApplied.set(false);

        },
        error: (error: HttpErrorResponse) => {
          this.snackbarService.error(this.getApiErrorMessage(error));
        },
      });
    this.keyEventSubject.start();
  }

  private getApiErrorMessage(error: HttpErrorResponse): string {
    const errorBody = error.error as { detail?: string; message?: string } | null | undefined;
    const messageKey = errorBody?.detail ?? errorBody?.message;

    if (messageKey) {
      return this.translationService.getTranslationForKey(messageKey);
    }

    return error.message;
  }

  private getTableItems(): void {
    this.tableItemsLoading.set(true);
    this.tableService
      .getById(this.tableId())
      .pipe(finalize(() => this.tableItemsLoading.set(false)))
      .subscribe({
        next: (table: Table) => {
          this.tableItems.set(table.tableItems);
          console.log(this.tableItems());
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
          this.tableName.set(table.code);
        },
        error: (error: HttpErrorResponse) => {
          this.snackbarService.error(error.message);
        },
      });
  }

  private resetProducts(): void {
    this.searchTerm.setValue('');
  }

  createTransaction(paymentMethod: number): void {
      if (!this.canEditTableValidation()) return;

      const request: TransactionRequest = {
          id: this.tableId(),
          paymentMethod,
          timeStamp: new Date().toISOString()
        };
        this.transactionService
          .add(request)
          .pipe(finalize(() => this.tableItemsLoading.set(false)))
          .subscribe({
            next: (transaction: Transaction) => {
              this.snackbarService.success(
                this.translationService.getTranslationForKey('shared.successfully')
              )
              if (this.settingsManager.logoutAfterTransaction()){
                this.staffAuthService.logout();
              }
              else {
                this.router.navigate(['/tables']);
              }
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
    }

  createTemporaryTable(): void{
    const request: TemporaryTableRequest = {
      id: 0,
      tableItems: this.tableItems(),
      name: this.tableName(),
      code: this.tableName(),
      staffUserID: this.staffStore.id()!
    }
    this.tableService
          .createTemporaryTable(request)
          .pipe(finalize(() => this.tableItemsLoading.set(false)))
          .subscribe({
            next: () => {
              this.snackbarService.success(
                this.translationService.getTranslationForKey('shared.successfully')
              )
            },
            error: (error: HttpErrorResponse) => {
              this.snackbarService.error(error.message);
            },
    });
  }


  canEditTableValidation(): boolean {
    if (!this.tableStaff())
      return true;
    
    if (!this.settingsManager.canEditOtherTables() && this.staffStore.id() != this.tableStaff()?.id) {
      this.snackbarService.error(
        this.translationService.getTranslationForKey('tables.errors.other-waiter')
      )
      return false;
    }
    return true;
  }

  canRemoveTableItemValidation(): boolean {
    if (this.settingsManager.canRemoveTableItems()) {
      return true;
    }

    this.snackbarService.error(
      this.translationService.getTranslationForKey(
        'tables.errors.remove-items-disabled'
      )
    );
    return false;
  }
}


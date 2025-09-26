import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from "@angular/core";
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from "@angular/material/dialog";
import { CategoriesService } from "../../../../core/services/api/categories.service";
import { ImageService } from "../../../../core/services/utility/image.service";
import { SnackbarService } from "../../../../core/services/utility/snackbar.service";
import { CommonModule } from "@angular/common";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatChipsModule } from "@angular/material/chips";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { ButtonComponent } from "../../../../core/ui/button/button.component";
import { UploadImageComponent } from "../../../../core/ui/upload-img/upload-img.component";
import { Category } from "../../../../core/models/api/responses/category.model";
import { HttpErrorResponse } from "@angular/common/http";
import { ProductsService } from "../../../../core/services/api/products.service";
import { ProductDialogData } from "../../models/product-dialog-data.dto";
import { Product } from "../../../../core/models/api/responses/product.model";
import { Observable } from 'rxjs';
import { ConfirmationDialog } from "../../../../core/ui/confirmation-dialog/confirmation-dialog.component";
import { LoaderComponent } from "../../../../core/ui/loader/loader.component";
import { ErrorDetails } from "../../../../core/models/error-details";
import { Page } from "../../../../core/models/api/page.model";
import { TaxService } from "../../../../core/services/api/tax.service";
import { Tax } from "../../../../core/models/api/responses/tax.model";
import { TranslateModule } from "@ngx-translate/core";
import TranslationService from "../../../../core/services/utility/translation.service";
import { PermissionService } from "../../../../core/services/auth/permission.service";
import { LookupModel } from "../../../../core/models/api/responses/lookup-model";


@Component({
      standalone: true,
    imports: [
    CommonModule,
    MatCardModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    UploadImageComponent,
    MatCheckboxModule,
    ButtonComponent,
    LoaderComponent,
    TranslateModule
],
    templateUrl: 'product-dialog.component.html',
    styleUrls: ['product-dialog.component.scss', '../../styles/dialog-style.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductDialog implements OnInit {
    readonly dialogRef = inject(MatDialogRef<ProductDialog>);
    readonly data = inject<ProductDialogData>(MAT_DIALOG_DATA);
    readonly dialog = inject(MatDialog);
    readonly fb = inject(FormBuilder);
    readonly categoryService = inject(CategoriesService);
    readonly productService = inject(ProductsService);
    readonly taxService = inject(TaxService);
    readonly snackbar = inject(SnackbarService);
    readonly imageService = inject(ImageService);
    readonly translationService = inject(TranslationService);
    private authz = inject(PermissionService);

    canUpdate = computed(() =>
        this.authz.has({ name: '/api/product/update', method: 'PUT' })
    );

    canDelete = computed(() =>
        this.authz.has({ name: '/api/product/delete', method: 'POST' })
    );
    
    productForm = this.fb.group({
        name: ['', Validators.required],
        code: ['', Validators.required],
        description: [''],
        image: [''],
        category: ['', Validators.required],
        price: ['', Validators.required],
        tax: ['', Validators.required],
        discountAmount: ['0'],
        discountPercent: ['0'],
        reason: [null]
    })
    categories = signal<LookupModel[]>([]);
    taxes = signal<LookupModel[]>([]);
    selectedCategory = signal<number>(0);
    selectedTax = signal<number>(0);
    isUpdateDialog = signal<boolean>(false);
    title = signal<string>(this.translationService.getTranslationForKey("menu.products.add-product"));
    submitBtnLabel = signal<string>(this.translationService.getTranslationForKey("shared.add"));
    imageUrl = signal<string | null>("");
    loading = signal<boolean>(false);
    errorMessages = signal<string[]>([]);


    ngOnInit(): void {
        this.getAllCategories();
        this.getAllTaxes();
        
        if (this.data.selectedCategory) {
            this.getCategoryControl().setValue(this.data.selectedCategory);
        }

        if (this.data.id) {
            this.loading.set(true);
            this.isUpdateDialog.set(true);
            this.title.set(this.translationService.getTranslationForKey("menu.products.update-product"))
            this.submitBtnLabel.set(this.translationService.getTranslationForKey("shared.update"));
            this.productService.getById(this.data.id).subscribe({
                next: (product: Product) => {
                    this.getNameControl().setValue(product.name);
                    this.getCodeControl().setValue(product.code);
                    this.getPriceControl().setValue(product.price);
                    this.getDescriptionControl().setValue(product.description);
                    this.getDiscountAmountControl().setValue(product.discountAmount);
                    this.getDiscountPercentControl().setValue(product.discountPercent);
                    this.imageUrl.set(product.image);
                    if(product.categoryID){
                        this.getCategoryControl().setValue(product.categoryID);                        
                    }
                    if(product.taxID){
                        this.getTaxControl().setValue(product.taxID);                        
                    }
                    this.loading.set(false);
                },
                error: (error: HttpErrorResponse) => {
                    this.snackbar.error(error.message)
                }
            })
        }
    }

    getNameControl(): AbstractControl {
        return this.productForm.get('name')!;
    }

    getCodeControl(): AbstractControl {
        return this.productForm.get('code')!;
    }

    getDescriptionControl(): AbstractControl {
        return this.productForm.get('description')!;
    }

    getImageControl(): AbstractControl {
        return this.productForm.get('image')!;
    }

    getCategoryControl(): AbstractControl {
        return this.productForm.get('category')!;
    }

    getPriceControl(): AbstractControl {
        return this.productForm.get('price')!;
    }

    getTaxControl(): AbstractControl {
        return this.productForm.get('tax')!;
    }

    getDiscountAmountControl(): AbstractControl {
        return this.productForm.get('discountAmount')!;
    }

    getDiscountPercentControl(): AbstractControl {
        return this.productForm.get('discountPercent')!;
    }

    getReasonControl(): AbstractControl {
        return this.productForm.get('reason')!;
    }
    onSubmit(): void {
        if(this.productForm.invalid){
            return;
        }
        const form = new FormData();
        
        form.append("name", this.getNameControl().value);
        form.append("code", this.getCodeControl().value);
        form.append("price", this.getPriceControl().value);
        form.append("description", this.getDescriptionControl().value);
        form.append("taxId", this.getTaxControl().value);
        form.append('discountAmount', this.getDiscountAmountControl().value);
        form.append('discountPercent', this.getDiscountPercentControl().value);
        form.append("fileBytes", this.getImageControl().value);
        form.append("categoryId", this.getCategoryControl().value);
        form.append("reason", this.getReasonControl().value);
        form.append("sourceLocation", "1");

        if (this.data.id) {
            form.append("id", this.data.id.toString());
        }

        const isEdit = !!this.data.id;
        const request$ = isEdit
            ? this.productService.update(form)
            : this.productService.add(form);

        const action = isEdit ? this.translationService.getTranslationForKey("shared.updated") : this.translationService.getTranslationForKey("shared.added");
        const message = `${this.translationService.getTranslationForKey("shared.succesfully")} ${action} ${this.translationService.getTranslationForKey("menu.products.product")}`;

        this.handleRequest(request$, message);
    }

    onDelete(): void {
        const dialogRef = this.dialog.open(ConfirmationDialog);
        dialogRef.afterClosed().subscribe((result: boolean) => {
            if(!result) {
                return;
            }
            this.handleRequest<number>(
                this.productService.delete(this.data.id!),
                `${this.translationService.getTranslationForKey("shared.succesfully")} ${this.translationService.getTranslationForKey("shared.deleted")} ${this.translationService.getTranslationForKey("menu.products.product")}`
            )            
        })
    }

    onDeleteImage(): void {
        this.getImageControl().setValue('');
        this.imageUrl.set('');
    }

    onUpload(event: File): void {
        this.getImageControl().setValue(event);
    }

    onInputChange(errorKey: string): void {
        this.errorMessages.set(this.errorMessages().filter(i => i !== errorKey));
    }

    compareWith(o1: Category, o2: Category): boolean {
        return o1.id === o2.id;
    }

        private handleRequest<T>(request$: Observable<T>, successMessage: string): void {
            request$.subscribe({
                next: (result: T) => {
                    this.snackbar.success(successMessage);
                    this.dialogRef.close(result);
                },
                error: (error: HttpErrorResponse) => {
                    const errorDetails = error.error as ErrorDetails;
                    this.errorMessages.set(errorDetails.detail.split(','));        
                }
            });
        }

    private getAllCategories(): void {
        this.categoryService.lookUp().subscribe({
            next: (result: LookupModel[]) => {
              this.categories.set(result);
            },
            error: (error: HttpErrorResponse) => {
              this.snackbar.error(error.message);
            }
        })
    }

    private getAllTaxes(): void {
        this.taxService.lookUp().subscribe({
            next: (result: LookupModel[]) => {
              this.taxes.set(result);
            },
            error: (error: HttpErrorResponse) => {
              this.snackbar.error(error.message);
            }
        })
      }
}
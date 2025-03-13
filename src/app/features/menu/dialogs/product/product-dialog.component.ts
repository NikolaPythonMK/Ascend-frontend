import { Component, inject, OnInit, signal } from "@angular/core";
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
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
import { Page } from "../../../../core/models/api/page.model";
import { Image } from "../../../../core/ui/upload-img/models/image.model";
import { ProductsService } from "../../../../core/services/api/products.service";


@Component({
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
        ButtonComponent
    ],
    templateUrl: 'product-dialog.component.html',
    styleUrls: ['product-dialog.component.scss']
})
export class ProductDialog implements OnInit {
    readonly dialogRef = inject(MatDialogRef<ProductDialog>);
    readonly dialog = inject(MatDialog);
    readonly fb = inject(FormBuilder);
    readonly categoryService = inject(CategoriesService);
    readonly productService = inject(ProductsService);
    readonly snackbar = inject(SnackbarService);
    readonly imageService = inject(ImageService);

    productForm = this.fb.group({
        name: ['', Validators.required],
        code: [''],
        description: [''],
        image: [''],
        category: [''],
        price: ['']
    })
    categories = signal<Category[]>([]);
    isUpdateDialog = signal<boolean>(false);
    title = signal<string>('Додади Продукт');
    submitBtnLabel = signal<string>('Додади');

    ngOnInit(): void {
        this.categoryService.getAll().subscribe({
            next: (result: Page<Category>) => {
                this.categories.set(result.data);
            },
            error: (error: HttpErrorResponse) => {
                this.snackbar.error(error.message);
            }
        })
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

    onSubmit(): void {
        if(this.productForm.invalid){
            return;
        }

        const view = new Uint8Array(this.getImageControl().value)
        const blob = new Blob([view], { type: 'image/*' });
        const form = new FormData();

        form.append("name", this.getNameControl().value);
        form.append("code", this.getCodeControl().value);
        form.append("price", this.getPriceControl().value);
        form.append("description", this.getDescriptionControl().value);
        form.append("image", blob);
        form.append("categoryId", this.getCategoryControl().value);

        this.productService.add(form).subscribe({
            next: (result) => {
                this.snackbar.success('Успешно е додаден продуктот');
                this.dialogRef.close(result);
            },
            error: (error: HttpErrorResponse) => {
                this.snackbar.error(error.message);
                this.dialogRef.close(false);
            }
        })
    }

    onDelete(): void {

    }

    onUpload(event: Image): void {
        this.getImageControl().setValue(event.url);
    }
}
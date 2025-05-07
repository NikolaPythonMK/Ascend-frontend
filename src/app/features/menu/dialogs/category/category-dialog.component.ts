import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from "@angular/core";
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import {MatChipsModule} from '@angular/material/chips';
import {MatCardModule} from '@angular/material/card';
import { UploadImageComponent } from "../../../../core/ui/upload-img/upload-img.component";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { ButtonComponent } from "../../../../core/ui/button/button.component";
import { Category } from "../../../../core/models/api/responses/category.model";
import { CategoryGroup } from "../../../../core/models/api/responses/category-group.model";
import { Image } from "../../../../core/ui/upload-img/models/image.model";
import { CategoryRequest } from "../../../../core/models/api/requests/category.request";
import { CategoriesService } from "../../../../core/services/api/categories.service";
import { HttpErrorResponse } from "@angular/common/http";
import { SnackbarService } from "../../../../core/services/utility/snackbar.service";
import type { CategoryDialogData } from "../../models/category-dialog-data.dto";
import { ConfirmationDialog } from "../../../../core/ui/confirmation-dialog/confirmation-dialog.component";
import { Observable } from "rxjs";
import { ImageService } from "../../../../core/services/utility/image.service";


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
    templateUrl: 'category-dialog.component.html',
    styleUrls: ['category-dialog.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CategoryDialog implements OnInit{
    readonly dialogRef = inject(MatDialogRef<CategoryDialog>);
    readonly data = inject<CategoryDialogData>(MAT_DIALOG_DATA);
    readonly dialog = inject(MatDialog);
    readonly fb = inject(FormBuilder);
    readonly categoryService = inject(CategoriesService);
    readonly snackbar = inject(SnackbarService);
    readonly imageService = inject(ImageService);

    categoryForm = this.fb.group({
        name: ['', Validators.required],
        description: [''],
        image: [''],
        selectedCategoryGroup: ['']
    })
    staffUser: any;
    isUpdateDialog = signal<boolean>(false);
    title = signal<string>('Додади Категорија');
    submitBtnLabel = signal<string>('Додади');

    ngOnInit(): void {
        if (this.data.selectedGroupId) {
            this.getSelectedCategoryGroup().setValue(this.data.selectedGroupId);
        }
        if(!this.data.category){
            return;
        }
        const category = this.data.category;
        this.getNameControl().setValue(category.name);
        this.getDescriptionControl().setValue(category.description);
        if(category.image){
            this.getImageControl().setValue(category.image);
        }
        if(category.categoryGroupId){
            this.getSelectedCategoryGroup().setValue(category.categoryGroupId);
        }
        this.isUpdateDialog.set(true);
        this.title.set('Ажурирај Категорија')
        this.submitBtnLabel.set('Ажурирај');
    }

    getNameControl(): AbstractControl {
        return this.categoryForm.get('name')!;
    }

    getDescriptionControl(): AbstractControl {
        return this.categoryForm.get('description')!;
    }

    getImageControl(): AbstractControl {
        return this.categoryForm.get('image')!;
    }

    getSelectedCategoryGroup(): AbstractControl {
        return this.categoryForm.get('selectedCategoryGroup')!;
    }

    onUpload(event: File): void {
        this.getImageControl().setValue(event);
        console.log(this.getImageControl().value);
    }

    onSubmit() {
        if (!this.categoryForm.valid) {
          return;
        }

        const form = new FormData();
        form.append("name", this.getNameControl().value);
        form.append("description", this.getDescriptionControl().value);
        form.append("fileBytes", this.getImageControl().value);
        form.append("categoryGroupId", this.getSelectedCategoryGroup().value);
        form.append("sourceLocation", "2");

        this.isUpdateDialog() && form.append("id", String(this.data.category!.id));

        const action$ = this.isUpdateDialog() ?
            this.categoryService.update(form) :
            this.categoryService.add(form);

        this.handleRequest<Category>(
            action$,
            'Успешно е додадена категоријата'
        );
    }

    onDelete(): void {
        const dialogRef = this.dialog.open(ConfirmationDialog);
        dialogRef.afterClosed().subscribe((result: boolean) => {
            if(!result) {
                return;
            }
            this.handleRequest<number>(
                this.categoryService.delete(this.data.category!.id),
                'Категоријата е успешно избришана'
            )            
        })
    }

    private handleRequest<T>(request$: Observable<T>, successMessage: string): void {
        request$.subscribe({
            next: (result: T) => {
                this.snackbar.success(successMessage);
                this.dialogRef.close(result);
            },
            error: (error: HttpErrorResponse) => {
                this.snackbar.error(error.message);
                this.dialogRef.close();
            }
        });
    }
}
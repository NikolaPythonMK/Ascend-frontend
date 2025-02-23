import { CommonModule } from "@angular/common";
import { Component, inject, OnInit, signal } from "@angular/core";
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
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


@Component({
    imports: [CommonModule,
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
    ButtonComponent],
    templateUrl: 'category-dialog.component.html',
    styleUrls: ['category-dialog.component.scss']
})
export class CategoryDialog implements OnInit{
    readonly dialogRef = inject(MatDialogRef<CategoryDialog>);
    readonly data = inject<CategoryDialogData>(MAT_DIALOG_DATA);
    readonly fb = inject(FormBuilder);
    readonly categoryService = inject(CategoriesService);
    readonly snackbar = inject(SnackbarService);

    categoryForm = this.fb.group({
        name: ['', Validators.required],
        description: [''],
        image: [''],
        selectedCategoryGroup: ['']
    })
    staffUser: any;

    ngOnInit(): void {
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

    onUpload(event: Image): void {
        this.getImageControl().setValue(event.url);
    }

    onSubmit() {
        if (!this.categoryForm.valid) {
          return;
        }
        const view = new Uint8Array(this.getImageControl().value)
        const blob = new Blob([view], { type: 'image/*' });
        const form = new FormData();

        form.append("name", this.getNameControl().value);
        form.append("description", this.getDescriptionControl().value);
        form.append("image", blob);
        form.append("categoryGroupId", this.getSelectedCategoryGroup().value);

        // const request: CategoryRequest = {
        //     name: this.getNameControl().value,
        //     description: this.getDescriptionControl().value,
        //     image: this.getImageControl().value,
        //     categoryGroup: this.getSelectedCategoryGroup().value
        // }

        this.categoryService.add(form).subscribe({
            next: (result: Category) => {
                this.snackbar.success('Успешно е додадена категоријата');
                this.dialogRef.close(result);
            },
            error: (error: HttpErrorResponse) => {
                this.snackbar.error(error.message);
                this.dialogRef.close();
            }
        })
    }
}
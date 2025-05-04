import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ButtonComponent } from '../../../../core/ui/button/button.component';
import { UploadImageComponent } from '../../../../core/ui/upload-img/upload-img.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Image } from '../../../../core/ui/upload-img/models/image.model';
import { CategoryGroupRequest } from '../../../../core/models/api/requests/category-group.request';
import { CategoryGroupService } from '../../../../core/services/api/category-group.service';
import { HttpErrorResponse } from '@angular/common/http';
import { CategoryGroup } from '../../../../core/models/api/responses/category-group.model';
import { SnackbarService } from '../../../../core/services/utility/snackbar.service';
import { Category } from '../../../../core/models/api/responses/category.model';
import { CategoryGroupDialogData } from '../../models/category-group-dialog-data.dto';

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
    ButtonComponent,
  ],
  templateUrl: 'category-group-dialog.component.html',
  styleUrls: ['category-group-dialog.component.scss'],
})
export class CategoryGroupDialog {
    private readonly fb = inject(FormBuilder);
    readonly dialogRef = inject(MatDialogRef<CategoryGroupDialog>);
    readonly data = inject<CategoryGroupDialogData>(MAT_DIALOG_DATA);
    readonly categoryGroupService = inject(CategoryGroupService);
    readonly snackbarService = inject(SnackbarService);

    categoryGroupForm = this.fb.group({
        name: ['', Validators.required],
        description: [''],
        selectedCategories: [[]]
    })
    imageUrl = signal<File | null>(null);

    getNameControl(): AbstractControl {
        return this.categoryGroupForm.get('name')!;
    }

    getDescriptionControl(): AbstractControl {
        return this.categoryGroupForm.get('description')!;
    }

    getSelectedCategoriesControl(): AbstractControl {
        return this.categoryGroupForm.get('selectedCategories')!;
    }

    onUpload(image: File){
      this.imageUrl.set(image);
    }

    onSubmit() {
        if (this.categoryGroupForm.invalid) {
          return;
        }

        const formData = new FormData();
        formData.append('name', this.getNameControl().value);
        formData.append('description', this.getDescriptionControl().value);
        formData.append('categories', JSON.stringify(this.getSelectedCategoriesControl().value));
        formData.append('fileBytes', this.imageUrl()!); 
        formData.append("sourceLocation", "3");

        this.categoryGroupService.add(formData).subscribe({
          next: (result: CategoryGroup) => {
            this.snackbarService.success('Успешно e искреирана групата на категории');
            this.dialogRef.close(result);
          },
          error: (error: HttpErrorResponse) => {
            this.snackbarService.error(error.message);
            this.dialogRef.close();
          }
        })

    }

    getCategoryName(id: number): string {
      return this.data.categories.find(i => i.id === id)?.name ?? '';
  }
}

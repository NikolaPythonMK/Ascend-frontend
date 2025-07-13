import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
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
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CategoryGroupService } from '../../../../core/services/api/category-group.service';
import { HttpErrorResponse } from '@angular/common/http';
import { CategoryGroup } from '../../../../core/models/api/responses/category-group.model';
import { SnackbarService } from '../../../../core/services/utility/snackbar.service';
import { Category } from '../../../../core/models/api/responses/category.model';
import { CategoryGroupDialogData } from '../../models/category-group-dialog-data.dto';
import { CategoriesService } from '../../../../core/services/api/categories.service';
import { finalize, Observable } from 'rxjs';
import { ConfirmationDialog } from '../../../../core/ui/confirmation-dialog/confirmation-dialog.component';
import { LoaderComponent } from "../../../../core/ui/loader/loader.component";
import { ErrorDetails } from '../../../../core/models/error-details';
import { Page } from '../../../../core/models/api/page.model';

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
    LoaderComponent
],
  templateUrl: 'category-group-dialog.component.html',
  styleUrls: ['category-group-dialog.component.scss', '../../styles/dialog-style.scss'],
})
export class CategoryGroupDialog implements OnInit{
    private readonly fb = inject(FormBuilder);
    readonly dialogRef = inject(MatDialogRef<CategoryGroupDialog>);
    readonly data = inject<number>(MAT_DIALOG_DATA);
    readonly categoryGroupService = inject(CategoryGroupService);
    readonly categoryService = inject(CategoriesService);
    readonly snackbarService = inject(SnackbarService);
    readonly dialog = inject(MatDialog);

    categoryGroupForm = this.fb.group({
        name: ['', Validators.required],
        description: [''],
        selectedCategories: [[]],
        image: ['']
    })
    
    imageUrl = signal<string>('');
    categories = signal<Category[]>([]);
    isUpdateDialog = signal<boolean>(false);
    title = signal<string>('Додади Група');
    submitBtnLabel = signal<string>('Додади');
    loading = signal<boolean>(false);
    errorMessages = signal<string[]>([]);

    ngOnInit(): void {
      this.getAllCategories();

      this.loading.set(true);
      this.isUpdateDialog.set(true);
      this.title.set('Ажурирај Група')
      this.submitBtnLabel.set('Ажурирај');


      this.categoryGroupService.getById(this.data)
          .pipe(
            finalize(() => this.loading.set(false))
          )
          .subscribe({
            next: (categoryGroup) => {
              console.log(categoryGroup)
              this.getNameControl().setValue(categoryGroup.name);
              this.getDescriptionControl().setValue(categoryGroup.descripton);
              this.getSelectedCategoriesControl().setValue(categoryGroup.categories.map(i => i.id))
              this.imageUrl.set(categoryGroup.image);
            },
            error: (error: HttpErrorResponse) => {
              this.snackbarService.error(error.message)
            },
          });
    }

    getNameControl(): AbstractControl {
        return this.categoryGroupForm.get('name')!;
    }

    getDescriptionControl(): AbstractControl {
        return this.categoryGroupForm.get('description')!;
    }

    getSelectedCategoriesControl(): AbstractControl {
        return this.categoryGroupForm.get('selectedCategories')!;
    }

    getImageControl(): AbstractControl {
      return this.categoryGroupForm.get('image')!;
    }

    onUpload(event: File): void {
        this.getImageControl().setValue(event);
    }

    onSubmit() {
        if (this.categoryGroupForm.invalid) {
          return;
        }

        const formData = new FormData();
        formData.append('name', this.getNameControl().value);
        formData.append('description', this.getDescriptionControl().value);
        formData.append('categories', JSON.stringify(this.getSelectedCategoriesControl().value));
        formData.append('fileBytes', this.getImageControl().value); 
        formData.append("sourceLocation", "3");

        if (this.data){
          formData.append("id", this.data.toString());
        }

        const isEdit = !!this.data;
        const request$ = isEdit
            ? this.categoryGroupService.update(formData)
            : this.categoryGroupService.add(formData);

        const action = isEdit ? 'ажурирана' : 'додадена';
        const message = `Успешно е ${action} групата`;

        this.handleRequest(request$, message);

    }

    onDelete(): void {
        const dialogRef = this.dialog.open(ConfirmationDialog);
        dialogRef.afterClosed().subscribe((result: boolean) => {
            if(!result) {
                return;
            }
            this.handleRequest<number>(
                this.categoryGroupService.delete(this.data!),
                'Групата е успешно избришана'
            )            
        })
    }

    getCategoryName(id: number): string {
      return this.categories().find(i => i.id === id)?.name ?? '';
    }

  private handleRequest<T>(request$: Observable<T>, successMessage: string): void {
      request$.subscribe({
           next: (result: T) => {
               this.snackbarService.success(successMessage);
               this.dialogRef.close(result);
          },
          error: (error: HttpErrorResponse) => {
                const errorDetails = error.error as ErrorDetails;
                this.errorMessages.set(errorDetails.detail.split(','));    
          }
      });
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
}

import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
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
import { SnackbarService } from '../../../../core/services/utility/snackbar.service';
import { Category } from '../../../../core/models/api/responses/category.model';
import { CategoriesService } from '../../../../core/services/api/categories.service';
import { finalize, Observable } from 'rxjs';
import { ConfirmationDialog } from '../../../../core/ui/confirmation-dialog/confirmation-dialog.component';
import { LoaderComponent } from "../../../../core/ui/loader/loader.component";
import { ErrorDetails } from '../../../../core/models/error-details';
import { Page } from '../../../../core/models/api/page.model';
import { TranslateModule } from '@ngx-translate/core';
import TranslationService from '../../../../core/services/utility/translation.service';
import { PermissionService } from '../../../../core/services/auth/permission.service';
import { LookupModel } from '../../../../core/models/api/responses/lookup-model';


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
    LoaderComponent,
    TranslateModule
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
    readonly translationService = inject(TranslationService);
    private authz = inject(PermissionService);

    canUpdate = computed(() =>
        this.authz.has({ name: '/api/categorygroup/update', method: 'PUT' })
    );

    canDelete = computed(() =>
        this.authz.has({ name: '/api/categorygroup/delete', method: 'POST' })
    );

    
    categoryGroupForm = this.fb.group({
        name: ['', Validators.required],
        description: [''],
        selectedCategories: [[]],
        image: ['']
    })
    
    imageUrl = signal<string>('');
    categories = signal<LookupModel[]>([]);
    isUpdateDialog = signal<boolean>(false);
    title = signal<string>(this.translationService.getTranslationForKey("menu.category-groups.add-group"));
    submitBtnLabel = signal<string>(this.translationService.getTranslationForKey("shared.add"));
    loading = signal<boolean>(false);
    errorMessages = signal<string[]>([]);

    ngOnInit(): void {
      this.getAllCategories();
  
      if(this.data != null){
        this.isUpdateDialog.set(true);
        this.title.set(this.translationService.getTranslationForKey("menu.category-groups.update-group"))
        this.submitBtnLabel.set(this.translationService.getTranslationForKey("shared.update"));
        this.loading.set(true);

        this.categoryGroupService.getById(this.data)
          .pipe(
            finalize(() => this.loading.set(false))
          )
          .subscribe({
            next: (categoryGroup) => {
              this.getNameControl().setValue(categoryGroup.name);
              this.getDescriptionControl().setValue(categoryGroup.description);
              this.getSelectedCategoriesControl().setValue(categoryGroup.categories.map(i => i.id))
              this.imageUrl.set(categoryGroup.image);
            },
            error: (error: HttpErrorResponse) => {
              this.snackbarService.error(error.message)
            },
          });
      }
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

        const action = isEdit ? this.translationService.getTranslationForKey("shared.updated") : this.translationService.getTranslationForKey("shared.added");
        const message = `${this.translationService.getTranslationForKey("shared.succesfully")} ${action} ${this.translationService.getTranslationForKey("menu.category-groups.group")}`;

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
                `${this.translationService.getTranslationForKey("shared.succesfully")} ${this.translationService.getTranslationForKey("shared.deleted")} ${this.translationService.getTranslationForKey("menu.category-groups.group")}`
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
    this.categoryService.lookUp().subscribe({
        next: (result: LookupModel[]) => {
          this.categories.set(result);
        },
        error: (error: HttpErrorResponse) => {
          this.snackbarService.error(error.message);
        }
    })
  }
}

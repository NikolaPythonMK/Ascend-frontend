import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from "@angular/core";
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
import { CategoriesService } from "../../../../core/services/api/categories.service";
import { HttpErrorResponse } from "@angular/common/http";
import { SnackbarService } from "../../../../core/services/utility/snackbar.service";
import type { CategoryDialogData } from "../../models/category-dialog-data.dto";
import { ConfirmationDialog } from "../../../../core/ui/confirmation-dialog/confirmation-dialog.component";
import { finalize, Observable } from "rxjs";
import { ImageService } from "../../../../core/services/utility/image.service";
import { LoaderComponent } from "../../../../core/ui/loader/loader.component";
import { ErrorDetails } from "../../../../core/models/error-details";
import { CategoryGroupService } from "../../../../core/services/api/category-group.service";
import { Page } from "../../../../core/models/api/page.model";
import { CategoryGroup } from "../../../../core/models/api/responses/category-group.model";
import { TranslateModule } from "@ngx-translate/core";
import TranslationService from "../../../../core/services/utility/translation.service";
import { PermissionService } from "../../../../core/services/auth/permission.service";
import { LookupModel } from "../../../../core/models/api/responses/lookup-model";

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
    templateUrl: 'category-dialog.component.html',
    styleUrls: ['category-dialog.component.scss', '../../styles/dialog-style.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CategoryDialog implements OnInit{
    readonly dialogRef = inject(MatDialogRef<CategoryDialog>);
    readonly data = inject<CategoryDialogData>(MAT_DIALOG_DATA);
    readonly dialog = inject(MatDialog);
    readonly fb = inject(FormBuilder);
    readonly categoryService = inject(CategoriesService);
    readonly categoryGroupService = inject(CategoryGroupService);
    readonly snackbar = inject(SnackbarService);
    readonly imageService = inject(ImageService);
    readonly translationService = inject(TranslationService);
    private authz = inject(PermissionService);

    canUpdate = computed(() =>
        this.authz.has({ name: '/api/category/update', method: 'PUT' })
    );

    canDelete = computed(() =>
        this.authz.has({ name: '/api/category/delete', method: 'POST' })
    );

    categoryForm = this.fb.group({
        name: ['', Validators.required],
        description: [''],
        image: [''],
        selectedCategoryGroup: ['']
    })
    staffUser: any;
    isUpdateDialog = signal<boolean>(false);
    title = signal<string>(this.translationService.getTranslationForKey("menu.categories.add-category"));
    submitBtnLabel = signal<string>(this.translationService.getTranslationForKey("shared.add"));
    imageUrl = signal<string>('');
    loading = signal<boolean>(false);
    errorMessages = signal<string[]>([]);
    categoryGroups = signal<LookupModel[]>([]);

    ngOnInit(): void {
        if (this.data.selectedGroupId) {
            this.getSelectedCategoryGroup().setValue(this.data.selectedGroupId);
        }

        this.loading.set(true);
        this.categoryGroupService.lookUp()
            .pipe(
                finalize(() => this.loading.set(false))   
            )    
            .subscribe({
               next: (result: LookupModel[]) => {
               this.categoryGroups.set(result);
            },
            error: (error: HttpErrorResponse) => {
                this.snackbar.error(error.message);
            }
        })

        if(!this.data.id){
            return;
        }

        this.isUpdateDialog.set(true);
        this.title.set(this.translationService.getTranslationForKey("menu.categories.update-category"))
        this.submitBtnLabel.set(this.translationService.getTranslationForKey("shared.update"));

        this.loading.set(true);
        this.categoryService.getById(this.data.id)
        .pipe(
           finalize(() => this.loading.set(false))
        )
        .subscribe({
            next: (category: Category) => {
                this.getNameControl().setValue(category.name);
                this.getDescriptionControl().setValue(category.description);
                this.imageUrl.set(category.image);
                if(category.categoryGroupID){
                    this.getSelectedCategoryGroup().setValue(category.categoryGroupID);
                }
                this.loading.set(false);
            },
            error: (error: HttpErrorResponse) => {
                this.snackbar.error(error.message);
            }
        })
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

        this.isUpdateDialog() && form.append("id", String(this.data.id));

        const isEdit = !!this.data.id;

        const action$ = this.isUpdateDialog() ?
            this.categoryService.update(form) :
            this.categoryService.add(form);

        const action = isEdit ? this.translationService.getTranslationForKey("shared.updated") : this.translationService.getTranslationForKey("shared.added");
        const message = `${this.translationService.getTranslationForKey("shared.succesfully")} ${action} ${this.translationService.getTranslationForKey("menu.categories.category")}`;

        this.handleRequest<Category>(
            action$,
            message
        );
    }

    onDelete(): void {
        const dialogRef = this.dialog.open(ConfirmationDialog);
        dialogRef.afterClosed().subscribe((result: boolean) => {
            if(!result) {
                return;
            }
            this.handleRequest<number>(
                this.categoryService.delete(this.data.id!),
                `${this.translationService.getTranslationForKey("shared.succesfully")} ${this.translationService.getTranslationForKey("shared.deleted")} ${this.translationService.getTranslationForKey("menu.categories.category")}`
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
                    const errorDetails = error.error as ErrorDetails;
                    this.errorMessages.set(errorDetails.detail.split(','));    
            }
        });
    }
}
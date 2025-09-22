import { Component, computed, inject, OnInit, signal } from "@angular/core";
import { AbstractControl, FormBuilder, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from "@angular/material/dialog";
import { LocationService } from "../../../../core/services/api/locations.service";
import { SnackbarService } from "../../../../core/services/utility/snackbar.service";
import { CreateLocatinDialog } from "../create-locations-dialog/create-location.component";
import { CommonModule } from "@angular/common";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule, MatLabel } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { ButtonComponent } from "../../../../core/ui/button/button.component";
import type { Location } from "../../../../core/models/api/responses/location.model";
import { MatIconModule } from "@angular/material/icon";
import { ConfirmationDialog } from "../../../../core/ui/confirmation-dialog/confirmation-dialog.component";
import type { LocationRequest } from "../../../../core/models/api/requests/location.request";
import { HttpErrorResponse } from "@angular/common/http";
import { finalize, Observable } from "rxjs";
import { LoaderComponent } from "../../../../core/ui/loader/loader.component";
import { TranslateModule } from "@ngx-translate/core";
import TranslationService from "../../../../core/services/utility/translation.service";
import { PermissionService } from "../../../../core/services/auth/permission.service";

@Component({
    imports: [MatFormFieldModule, 
        MatSelectModule, 
        FormsModule, 
        ReactiveFormsModule, 
        MatInputModule, 
        ButtonComponent, 
        MatLabel, 
        CommonModule, 
        MatButtonModule, 
        MatIconModule, 
        LoaderComponent,
        TranslateModule],
    templateUrl: 'update-location.component.html',
    styleUrls: ['update-location.component.scss']
})
export class UpdateLocationDialog implements OnInit{
    readonly dialogRef = inject(MatDialogRef<CreateLocatinDialog>);
    readonly data = inject<number>(MAT_DIALOG_DATA);
    private readonly dialog = inject(MatDialog);
    private readonly fb = inject(FormBuilder);
    private readonly locationsService = inject(LocationService)
    private readonly snackbarService = inject(SnackbarService);
    private readonly translationService = inject(TranslationService);
    private authz = inject(PermissionService);
    
    canUpdate = computed(() =>
            this.authz.has({ name: '/api/location/update', method: 'PUT' })
    );
    
    canDelete = computed(() =>
            this.authz.has({ name: '/api/location/delete', method: 'POST' })
    );    

    locationForm = this.fb.group({
        name: ['', Validators.required],
    })
    loading = signal<boolean>(false);

    ngOnInit(): void {
        this.locationsService.getById(this.data)
          .pipe(
            finalize(() => this.loading.set(false))
          )
          .subscribe({
            next: (location) => {
              this.getNameControl().setValue(location.name)
            },
            error: (error: HttpErrorResponse) => {
              this.snackbarService.error(error.message)
            },
          });
    }

    getNameControl(): AbstractControl {
        return this.locationForm.get('name')!;
    }

    onSubmit(): void {
        if (this.locationForm.invalid) {
            return;
        }
    
        const request: LocationRequest = {
            id: this.data,
            name: this.getNameControl().value,
            tabbleLocationMapping: ''
        };
        this.loading.set(true);
        this.handleRequest(
            this.locationsService.update(request),
            this.translationService.getTranslationForKey("shared.succesfully")
        );
    }
    
    onDelete(): void {
        this.dialog.open(ConfirmationDialog).afterClosed().subscribe((isConfirmed: boolean) => {
            if (!isConfirmed) {
                return;
            }
            this.loading.set(true);
            this.handleRequest(
                this.locationsService.delete(this.data),
                this.translationService.getTranslationForKey("shared.succesfully")
            );
        });
    }


    private handleRequest<T>(request$: Observable<T>, successMessage: string): void {
        request$.pipe(finalize(() => this.loading.set(false)))
        .subscribe({
            next: (result: T) => {
                this.snackbarService.success(successMessage);
                this.dialogRef.close(result);
            },
            error: (error: HttpErrorResponse) => {
                this.snackbarService.error(error.message);
                this.dialogRef.close();
            }
        });
    }
}
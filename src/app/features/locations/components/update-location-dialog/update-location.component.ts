import { Component, inject, OnInit } from "@angular/core";
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
import { Observable } from "rxjs";

@Component({
    imports: [MatFormFieldModule, MatSelectModule, FormsModule, ReactiveFormsModule, MatInputModule, ButtonComponent, MatLabel, CommonModule, MatButtonModule, MatIconModule ],
    templateUrl: 'update-location.component.html',
    styleUrls: ['update-location.component.scss']
})
export class UpdateLocationDialog implements OnInit{
    readonly dialogRef = inject(MatDialogRef<CreateLocatinDialog>);
    readonly data = inject<Location>(MAT_DIALOG_DATA);
    private readonly dialog = inject(MatDialog);
    private readonly fb = inject(FormBuilder);
    private readonly locationsService = inject(LocationService)
    private readonly snackbarService = inject(SnackbarService);
    locationForm = this.fb.group({
        name: ['', Validators.required],
    })

    ngOnInit(): void {
        this.getNameControl().setValue(this.data.name);
    }

    getNameControl(): AbstractControl {
        return this.locationForm.get('name')!;
    }

    onSubmit(): void {
        if (this.locationForm.invalid) {
            return;
        }
    
        const request: LocationRequest = {
            id: this.data.id,
            name: this.getNameControl().value,
            tabbleLocationMapping: ''
        };
        this.handleRequest(
            this.locationsService.update(request),
            'Успешно'
        );
    }
    
    onDelete(): void {
        this.dialog.open(ConfirmationDialog).afterClosed().subscribe((isConfirmed: boolean) => {
            if (!isConfirmed) {
                return;
            }
            this.handleRequest(
                this.locationsService.delete(this.data.id),
                'Успешно'
            );
        });
    }


    private handleRequest<T>(request$: Observable<T>, successMessage: string): void {
        request$.subscribe({
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
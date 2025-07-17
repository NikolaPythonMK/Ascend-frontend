import { Component, inject, signal } from "@angular/core";
import { AbstractControl, FormBuilder, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatFormFieldModule, MatLabel } from "@angular/material/form-field";
import { ButtonComponent } from "../../../../core/ui/button/button.component";
import { MatDialogRef } from "@angular/material/dialog";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { CommonModule } from "@angular/common";
import { MatButtonModule } from "@angular/material/button";
import { LocationService } from "../../../../core/services/api/locations.service";
import { HttpErrorResponse } from "@angular/common/http";
import { SnackbarService } from "../../../../core/services/utility/snackbar.service";
import type { LocationRequest } from "../../../../core/models/api/requests/location.request";
import type { Location } from "../../../../core/models/api/responses/location.model";
import { finalize } from "rxjs";
import { LoaderComponent } from "../../../../core/ui/loader/loader.component";
import { TranslateModule } from "@ngx-translate/core";
import TranslationService from "../../../../core/services/utility/translation.service";

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
        LoaderComponent,
        TranslateModule],
    templateUrl: 'create-location.component.html',
    styleUrls: ['create-location.component.scss']
})
export class CreateLocatinDialog {
    readonly dialogRef = inject(MatDialogRef<CreateLocatinDialog>);
    private readonly fb = inject(FormBuilder);
    private readonly locationsService = inject(LocationService)
    private readonly snackbarService = inject(SnackbarService);
    private readonly translationService = inject(TranslationService);

    locationForm = this.fb.group({
        name: ['', Validators.required],
        tableCount: [0, Validators.required]
    })
    loading = signal<boolean>(false);

    getNameControl(): AbstractControl {
        return this.locationForm.get('name')!;
    }

    getTableCountControl(): AbstractControl {
        return this.locationForm.get('tableCount')!;
    }


    onSubmit(): void {
        if (this.locationForm.invalid){
            return;
        }
        const request: LocationRequest = {
            name: this.getNameControl().value,
            numberOfTables: this.getTableCountControl().value
        }
        this.loading.set(true);
        this.locationsService.add(request).pipe(
            finalize(() => this.loading.set(false))
        ).subscribe({
            next: (result: Location) => {
                this.snackbarService.success(this.translationService.getTranslationForKey("shared.succesfully"));
                this.dialogRef.close(result);
            },
            error: (error: HttpErrorResponse) => {
                this.snackbarService.error(error.message);
                this.dialogRef.close();
            }
        })
    }
}
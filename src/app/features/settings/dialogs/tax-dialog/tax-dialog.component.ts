import { Component, inject, signal } from "@angular/core";
import { FormBuilder, Validators, AbstractControl, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatDialogRef } from "@angular/material/dialog";
import { SnackbarService } from "../../../../core/services/utility/snackbar.service";
import { LoaderComponent } from "../../../../core/ui/loader/loader.component";
import { CommonModule } from "@angular/common";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule, MatLabel } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { ButtonComponent } from "../../../../core/ui/button/button.component";
import { TaxRequest } from "../../../../core/models/api/requests/tax.request";
import { TaxService } from "../../../../core/services/api/tax.service";
import { HttpErrorResponse } from "@angular/common/http";
import { finalize, Observable } from "rxjs";
import { ErrorDetails } from "../../../../core/models/error-details";
import { MatIconModule } from "@angular/material/icon";
import { TableComponent } from "../../../../core/ui/table/table.component";
import { Tax } from "../../../../core/models/api/responses/tax.model";


const DATA = [
    {name: 'Name1', taxValueCurrent: 1.5, taxValuePrevious: 1.0, date: '03-05-2012', user: 'Nikola'},
    {name: 'Name1', taxValueCurrent: 1.5, taxValuePrevious: 1.0, date: '03-05-2012', user: 'Nikola'},
    {name: 'Name1', taxValueCurrent: 1.5, taxValuePrevious: 1.0, date: '03-05-2012', user: 'Nikola'},
    {name: 'Name1', taxValueCurrent: 1.5, taxValuePrevious: 1.0, date: '03-05-2012', user: 'Nikola'},
]

@Component({
    imports: [MatFormFieldModule, MatSelectModule, FormsModule, ReactiveFormsModule, MatInputModule, ButtonComponent, MatLabel, CommonModule, MatButtonModule, LoaderComponent, MatIconModule, TableComponent],
    templateUrl: 'tax-dialog.component.html',
    styleUrls: ['tax-dialog.component.scss']
})
export class TaxDialog{
    readonly dialogRef = inject(MatDialogRef<TaxDialog>);
    private readonly fb = inject(FormBuilder);
    private readonly taxService = inject(TaxService);
    private readonly snackbarService = inject(SnackbarService);
    taxHistory = signal(DATA);
    taxForm = this.fb.group({
        name: ['', Validators.required],
        percentage: [0, Validators.required]
    })
    loading = signal<boolean>(false);
    errorMessages = signal<string[]>([]);

 
    getNameControl(): AbstractControl {
        return this.taxForm.get('name')!;
    }

    getPercentageControl(): AbstractControl {
        return this.taxForm.get('percentage')!;
    }

    onSubmit(): void {
        if (this.taxForm.invalid){
            return;
        }
        const request: TaxRequest = {
            id: 0,
            name: this.getNameControl().value,
            percentage: this.getPercentageControl().value,
            reason: ''
        }
        this.loading.set(true);

        this.taxService.add(request).pipe(
            finalize(() => this.loading.set(false))
        ).subscribe({
            next: (tax: Tax) => {
                this.snackbarService.success('Успешно');
                this.dialogRef.close(tax);
            },
            error: (error: HttpErrorResponse) => {
                this.snackbarService.error(error.message);
                this.dialogRef.close();
            }
        })
    }  
}
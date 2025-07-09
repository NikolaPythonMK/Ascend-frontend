import { CommonModule } from '@angular/common';
import { Component, inject, Signal, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule, MatLabel } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ButtonComponent } from '../../../../../core/ui/button/button.component';
import { LoaderComponent } from '../../../../../core/ui/loader/loader.component';
import { HttpErrorResponse } from '@angular/common/http';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { finalize, Observable, switchMap, of, map, tap } from 'rxjs';
import { TaxRequest } from '../../../../../core/models/api/requests/tax.request';
import { Tax } from '../../../../../core/models/api/responses/tax.model';
import { ErrorDetails } from '../../../../../core/models/error-details';
import { TaxService } from '../../../../../core/services/api/tax.service';
import { SnackbarService } from '../../../../../core/services/utility/snackbar.service';
import { TaxDialogData } from '../../../models/tax-dialog-data.dto';
import { TableComponent } from '../../../../../core/ui/table/table.component';
import { TaxHistoryService } from '../../../../../core/services/api/tax-history.service';
import { Filter } from '../../../../../core/models/api/value-objects/filter.model';
import { DataRow } from '../../../../../core/ui/table/models/data-row';
import { TaxHistory } from '../../../../../core/models/api/responses/tax-history.model';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfirmationDialog } from '../../../../../core/ui/confirmation-dialog/confirmation-dialog.component';

@Component({
  imports: [
    MatFormFieldModule,
    MatSelectModule,
    FormsModule,
    ReactiveFormsModule,
    MatInputModule,
    ButtonComponent,
    MatLabel,
    CommonModule,
    MatButtonModule,
    LoaderComponent,
    MatIconModule,
    TableComponent,
  ],
  templateUrl: 'tax-details.component.html',
  styleUrls: ['tax-details.component.scss'],
})
export class TaxDetailsPage {
  private readonly fb = inject(FormBuilder);
  private readonly taxService = inject(TaxService);
  private readonly taxHistoryService = inject(TaxHistoryService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private filter: Filter = {
    propName: 'Name',
    operator: '=',
    value: ''
  }
  id = signal<number>(0);
  taxForm = this.fb.group({
    name: ['', Validators.required],
    percentage: [0, Validators.required],
    reason: ['', Validators.required],
  });
  loading = signal<boolean>(false);
  errorMessages = signal<string[]>([]);
  dataRows = signal<DataRow[]>([]);

  ngOnInit(): void {
    this.id.set(Number(this.route.snapshot.paramMap.get('id')));
    this.loading.set(true);

    this.taxService.getById(this.id())
    .pipe(
      tap(i => this.filter.value = i.name),
      switchMap(tax =>
        this.taxHistoryService.getAll(undefined, undefined, [this.filter])
          .pipe(
            map(page => ({ page, tax }))
          )
      ),
      finalize(() => this.loading.set(false))
    )
    .subscribe({
      next: ({page, tax}) => {
        this.getNameControl().setValue(tax.name);
        this.getPercentageControl().setValue(tax.percentage);
        this.getReasonControl().setValue(tax.reason);
        this.dataRows.set(this.mapToRows(page.data));
      },
      error: (error: HttpErrorResponse) => {
        this.snackbarService.error(error.message);
      },
    });
  }

  getNameControl(): AbstractControl {
    return this.taxForm.get('name')!;
  }

  getPercentageControl(): AbstractControl {
    return this.taxForm.get('percentage')!;
  }

  getReasonControl(): AbstractControl {
    return this.taxForm.get('reason')!;
  }

  onSubmit(): void {
    if (this.taxForm.invalid) {
      return;
    }
    const request: TaxRequest = {
      name: this.getNameControl().value,
      percentage: this.getPercentageControl().value,
      reason: this.getReasonControl().value,
    };

    this.loading.set(true);

    this.taxService.update(request)
    .pipe(
      switchMap(tax =>
        this.taxHistoryService.getAll(undefined, undefined, [this.filter])
          .pipe(
            map(page => ({ page, tax }))
          )
      ),
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: ({page, tax}) => {
        this.dataRows.set(this.mapToRows(page.data));
      },
      error: (error: HttpErrorResponse) => {
        this.snackbarService.error(error.message);
      }
    })
  }

  onDelete(): void {
    const dialogRef = this.dialog.open(ConfirmationDialog);
    dialogRef.afterClosed().subscribe(result => {
      if(!result){
        return;
      }
    this.taxService.delete(this.id()).subscribe({
      next: (id: number) => {
        this.snackbarService.success('Успешно е избришан данокот');
        this.router.navigate(['/settings']); // ???
      },
      error: (error: HttpErrorResponse) => {
        this.snackbarService.error(error.message);
      }
    })      
    })
  }

  private mapToRows(taxHistoryList: TaxHistory[]): DataRow[] {
    return taxHistoryList.map((i, index) => ({
      id: index,
      properties: {
        percentage: i.percentage,
        changedAt: i.changedAt,
        changedBy: i.changedBy,
        reason: i.reason
      }
    }))
  }
}

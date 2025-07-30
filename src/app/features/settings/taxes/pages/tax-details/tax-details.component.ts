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
import { MatDialog } from '@angular/material/dialog';
import { finalize } from 'rxjs';
import { TaxRequest } from '../../../../../core/models/api/requests/tax.request';
import { TaxService } from '../../../../../core/services/api/tax.service';
import { SnackbarService } from '../../../../../core/services/utility/snackbar.service';
import { TableComponent } from '../../../../../core/ui/table/table.component';
import { DataRow } from '../../../../../core/ui/table/models/data-row';
import { TaxHistory } from '../../../../../core/models/api/responses/tax-history.model';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfirmationDialog } from '../../../../../core/ui/confirmation-dialog/confirmation-dialog.component';
import { TranslateModule } from '@ngx-translate/core';
import TranslationService from '../../../../../core/services/utility/translation.service';

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
    TranslateModule
  ],
  templateUrl: 'tax-details.component.html',
  styleUrls: ['tax-details.component.scss', '../../../../../core/styles/menu-item-page.scss'],
})
export class TaxDetailsPage {
  private readonly fb = inject(FormBuilder);
  private readonly taxService = inject(TaxService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly translationService = inject(TranslationService);

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
      finalize(() => this.loading.set(false))
    )
    .subscribe({
      next: (tax) => {
        this.getNameControl().setValue(tax.name);
        this.getPercentageControl().setValue(tax.percentage);
        this.dataRows.set(this.mapToRows(tax.taxHistory));
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
  
  onDelete(): void {
    const dialogRef = this.dialog.open(ConfirmationDialog);
    dialogRef.afterClosed().subscribe(result => {
      if(!result){
        return;
      }
    this.taxService.delete(this.id()).subscribe({
      next: (id: number) => {
        this.snackbarService.success(`${this.translationService.getTranslationForKey("shared.succesfully")} ${this.translationService.getTranslationForKey("shared.deleted")}`);
        this.router.navigate(['/settings']);
      },
      error: (error: HttpErrorResponse) => {
        this.snackbarService.error(error.message);
      }
    })      
    })
  }

  onUpdate(id: number): void {
    if (this.taxForm.invalid) {
      return;
    }
    const request: TaxRequest = {
      id: id,
      name: this.getNameControl().value,
      percentage: this.getPercentageControl().value,
      reason: this.getReasonControl().value,
    };

    this.loading.set(true);

    this.taxService.update(request)
    .pipe(
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: () => {
        this.taxService.getById(id)
          .pipe(
            finalize(() => this.loading.set(false))
          )
          .subscribe({
            next: (tax) => {
              this.getNameControl().setValue(tax.name);
              this.getPercentageControl().setValue(tax.percentage);
              this.dataRows.set(this.mapToRows(tax.taxHistory));
            },
            error: (error: HttpErrorResponse) => {
              this.snackbarService.error(error.message);
            },
          });
      },
      error: (error: HttpErrorResponse) => {
        this.snackbarService.error(error.message);
      }
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

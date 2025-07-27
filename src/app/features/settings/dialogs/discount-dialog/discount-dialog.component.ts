import { Component, inject, OnInit, signal } from '@angular/core';
import {
  FormBuilder,
  Validators,
  AbstractControl,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { SnackbarService } from '../../../../core/services/utility/snackbar.service';
import { LoaderComponent } from '../../../../core/ui/loader/loader.component';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule, MatLabel } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ButtonComponent } from '../../../../core/ui/button/button.component';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize, Observable } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import TranslationService from '../../../../core/services/utility/translation.service';
import { TranslateModule } from '@ngx-translate/core';
import { Discount } from '../../../../core/models/api/responses/discount.model';
import { DiscountService } from '../../../../core/services/api/discount.service';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import {
  MatNativeDateModule,
  provideNativeDateAdapter,
} from '@angular/material/core';
import { DiscountRequest } from '../../../../core/models/api/requests/discount.request';
import { DiscountType } from '../../../../core/models/enums/discount-type.enum';
import { ErrorDetails } from '../../../../core/models/error-details';
import { ConfirmationDialog } from '../../../../core/ui/confirmation-dialog/confirmation-dialog.component';
import { ChangeDetectionStrategy } from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTimepickerModule } from '@angular/material/timepicker';

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
    TranslateModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatTimepickerModule,
    FormsModule,
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: 'discount-dialog.component.html',
  styleUrls: ['discount-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiscountDialog implements OnInit {
  readonly panelOpenState = signal(false);
  readonly dialogRef = inject(MatDialogRef<DiscountDialog>);
  private readonly fb = inject(FormBuilder);
  readonly data = inject<number>(MAT_DIALOG_DATA);
  private readonly discountService = inject(DiscountService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly translationService = inject(TranslationService);
  private readonly dialog = inject(MatDialog);

  isUpdate = signal<boolean>(false);

  discountForm = this.fb.group({
    name: ['', Validators.required],
    code: ['', Validators.required],
    discountType: [
      { value: '', disabled: this.isUpdate() },
      [Validators.required],
    ], // 1 -> percent 2 -> amount
    value: [{ value: 0, disabled: this.isUpdate() }, [Validators.required]],
    startDate: [null],
    endDate: [null],
    startTime: null,
    endTime: null
  });
  loading = signal<boolean>(false);
  errorMessages = signal<string[]>([]);
  submitBtn = signal('shared.add');
  value: Date | undefined;

  ngOnInit(): void {
    if (!this.data) return;
    this.isUpdate.set(true);
    this.submitBtn.set('shared.update');
    this.loading.set(true);
    this.discountService
      .getById(this.data)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (discount: Discount) => {
          this.getNameControl().setValue(discount.name);
          this.getCodeControl().setValue(discount.code);
          //this.getDiscountTypeControl().setValue(discount.type);
          this.getValueControl().setValue(discount.value);
          this.getStartDate().setValue(discount.startDate?.toISOString());
          this.getEndDate().setValue(discount.endDate?.toISOString());
          this.getStartTime().setValue(discount.startTime?.toISOString());
          this.getEndTime().setValue(discount.endTime?.toISOString())
        },
        error: (error: HttpErrorResponse) => {
          this.snackbarService.error(error.message);
        },
      });
  }

  getNameControl(): AbstractControl {
    return this.discountForm.get('name')!;
  }

  getCodeControl(): AbstractControl {
    return this.discountForm.get('code')!;
  }

  getDiscountTypeControl(): AbstractControl {
    return this.discountForm.get('discountType')!;
  }

  getValueControl(): AbstractControl {
    return this.discountForm.get('value')!;
  }

  getStartDate(): AbstractControl {
    return this.discountForm.get('startDate')!;
  }

  getEndDate(): AbstractControl {
    return this.discountForm.get('endDate')!;
  }

  
  getStartTime(): AbstractControl {
    return this.discountForm.get('startTime')!;
  }

  getEndTime(): AbstractControl {
    return this.discountForm.get('endTime')!;
  }

  onSubmit(): void {
    if (this.discountForm.invalid) {
      return;
    }
    const request: DiscountRequest = {
      id: this.data ?? 0,
      name: this.getNameControl().value,
      code: this.getCodeControl().value,
      value: this.getValueControl().value,
      discountType: this.getDiscountTypeControl().value as DiscountType,
      startDate: this.getStartDate().value,
      endDate: this.getEndDate().value,
      startTime: this.getStartTime().value,
      endTime: this.getEndTime().value
    };

    this.loading.set(true);

    const isEdit = !!this.data;
    const request$ = isEdit
      ? this.discountService.update(request)
      : this.discountService.add(request);

    const action = isEdit
      ? this.translationService.getTranslationForKey('shared.updated')
      : this.translationService.getTranslationForKey('shared.added');
    const message = `${this.translationService.getTranslationForKey(
      'shared.succesfully'
    )} ${action}`;

    this.handleRequest(request$, message);
  }

  onDelete(): void {
    const dialogRef = this.dialog.open(ConfirmationDialog);
    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (!result) {
        return;
      }
      this.handleRequest<number>(
        this.discountService.delete(this.data),
        `${this.translationService.getTranslationForKey('shared.succesfully')}`
      );
    });
  }

  private handleRequest<T>(
    request$: Observable<T>,
    successMessage: string
  ): void {
    this.loading.set(true);
    request$.pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (result: T) => {
        this.snackbarService.success(successMessage);
        this.dialogRef.close(result);
      },
      error: (error: HttpErrorResponse) => {
        const errorDetails = error.error as ErrorDetails;
        this.errorMessages.set(errorDetails.detail.split(','));
      },
    });
  }
}

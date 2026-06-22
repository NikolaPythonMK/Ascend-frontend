import { Component, computed, inject, OnInit, signal } from '@angular/core';
import {
  FormBuilder,
  Validators,
  AbstractControl,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
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
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import { PermissionService } from '../../../../core/services/auth/permission.service';

export const validateDiscount: ValidatorFn = (
  control
): ValidationErrors | null => {
  const type = Number(control.get('discountType')?.value);
  const value = Number(control.get('value')?.value);
  const startDate = control.get('startDate')?.value;
  const endDate = control.get('endDate')?.value;
  const errors: ValidationErrors = {};

  if (type === DiscountType.percent && value > 100) {
    errors['percentageTooHigh'] = true;
  }

  if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
    errors['invalidDateRange'] = true;
  }

  return Object.keys(errors).length ? errors : null;
};

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
    MatDatepickerModule,
    MatNativeDateModule,
    MatExpansionModule,
    MatSlideToggleModule
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
  private readonly authz = inject(PermissionService);

  canUpdate = computed(() => this.authz.has({ name: '/api/discount/update', method: 'PUT' }));
  canDelete = computed(() => this.authz.has({ name: '/api/discount/delete', method: 'POST' }));

  isUpdate = signal<boolean>(false);

  discountForm = this.fb.group({
    name: ['', Validators.required],
    code: ['', Validators.required],
    discountType: ['', Validators.required],
    value: [0, [Validators.required, Validators.min(0.01)]],
    startDate: [null],
    endDate: [null],
    isActive: true,
    minPurchase: [null, Validators.min(0)],
  }, { validators: validateDiscount });
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
          this.getNameControl().setValue(discount.name ?? '');
          this.getCodeControl().setValue(discount.code);
          this.getDiscountTypeControl().setValue(
            this.normalizeDiscountType(discount.discountType)
          );
          this.getValueControl().setValue(discount.value);
          this.getStartDate().setValue(this.parseDate(discount.startDate));
          this.getEndDate().setValue(this.parseDate(discount.endDate));
          this.getMinPurchaseControl().setValue(discount.minPurchase ?? null);
          this.getIsActiveControl().setValue(discount.isActive);

          if (!this.canUpdate()) {
            this.discountForm.disable();
          }
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

  
  getMinPurchaseControl(): AbstractControl {
    return this.discountForm.get('minPurchase')!;
  }

  getIsActiveControl(): AbstractControl {
    return this.discountForm.get('isActive')!;
  }

  onSubmit(): void {
    if ((this.isUpdate() && !this.canUpdate()) || this.discountForm.invalid) {
      return;
    }
    const request: DiscountRequest = {
      id: this.data ?? 0,
      name: this.getNameControl().value,
      code: this.getCodeControl().value,
      value: this.getValueControl().value,
      discountType: this.getDiscountTypeControl().value as DiscountType,
      startDate: this.toDateOnly(this.getStartDate().value),
      endDate: this.toDateOnly(this.getEndDate().value),
      minPurchase: this.getMinPurchaseControl().value,
      isActive: this.getIsActiveControl().value
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
        const errorDetails = error.error as ErrorDetails | undefined;
        const details = errorDetails?.detail
          ? errorDetails.detail.split(',')
          : [error.message];
        this.errorMessages.set(details);
        this.snackbarService.error(
          this.translationService.getTranslationForKey(details[0])
        );
      },
    });
  }

  private normalizeDiscountType(
    type: Discount['discountType']
  ): DiscountType | null {
    const normalized = String(type).toLowerCase();
    if (normalized === '1' || normalized === 'percentage') {
      return DiscountType.percent;
    }
    if (normalized === '2' || normalized === 'fixedamount') {
      return DiscountType.amount;
    }
    return null;
  }

  private parseDate(value?: string | null): Date | null {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private toDateOnly(value: Date | string | null): string | null {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return null;

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

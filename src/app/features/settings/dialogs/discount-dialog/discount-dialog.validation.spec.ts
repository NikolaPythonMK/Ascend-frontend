import { FormBuilder, Validators } from '@angular/forms';
import { DiscountType } from '../../../../core/models/enums/discount-type.enum';
import { validateDiscount } from './discount-dialog.component';

describe('discount form validation', () => {
  const createForm = (
    discountType: DiscountType,
    value: number,
    startDate: Date | null = null,
    endDate: Date | null = null
  ) => new FormBuilder().group({
    discountType: [discountType, Validators.required],
    value: [value, Validators.required],
    startDate: [startDate],
    endDate: [endDate],
  }, { validators: validateDiscount });

  it('rejects percentage discounts above 100 percent', () => {
    const form = createForm(DiscountType.percent, 101);

    expect(form.hasError('percentageTooHigh')).toBeTrue();
  });

  it('allows fixed discounts above 100 currency units', () => {
    const form = createForm(DiscountType.amount, 150);

    expect(form.hasError('percentageTooHigh')).toBeFalse();
  });

  it('rejects an end date before the start date', () => {
    const form = createForm(
      DiscountType.percent,
      10,
      new Date(2026, 5, 22),
      new Date(2026, 5, 21)
    );

    expect(form.hasError('invalidDateRange')).toBeTrue();
  });
});

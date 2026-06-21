import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { PermissionService } from '../../core/services/auth/permission.service';
import { DiscountService } from '../../core/services/api/discount.service';
import { TaxService } from '../../core/services/api/tax.service';
import { SnackbarService } from '../../core/services/utility/snackbar.service';
import { TableStateService } from '../../core/services/utility/table-state.service';
import { SettingsDiscountsComponent } from './discounts/settings-discounts.component';
import { SettingsTaxesComponent } from './taxes/settings-taxes.component';

describe('settings table search', () => {
  const page = { data: [], count: 0, pages: 0 };
  let taxService: jasmine.SpyObj<TaxService>;
  let discountService: jasmine.SpyObj<DiscountService>;

  beforeEach(() => {
    taxService = jasmine.createSpyObj<TaxService>('TaxService', ['getAll']);
    discountService = jasmine.createSpyObj<DiscountService>('DiscountService', [
      'getAll',
    ]);
    taxService.getAll.and.returnValue(of(page));
    discountService.getAll.and.returnValue(of(page));

    TestBed.configureTestingModule({
      providers: [
        TableStateService,
        { provide: TaxService, useValue: taxService },
        { provide: DiscountService, useValue: discountService },
        { provide: SnackbarService, useValue: { error: jasmine.createSpy() } },
        { provide: MatDialog, useValue: { open: jasmine.createSpy() } },
        { provide: Router, useValue: { navigate: jasmine.createSpy() } },
        {
          provide: PermissionService,
          useValue: { has: jasmine.createSpy().and.returnValue(true) },
        },
      ],
    });
  });

  it('searches taxes by name', () => {
    const component = TestBed.runInInjectionContext(
      () => new SettingsTaxesComponent()
    );

    component.onSearch('vat');

    expect(taxService.getAll).toHaveBeenCalledWith(
      [{ propName: 'Name', searchValue: 'vat' }],
      undefined
    );
  });

  it('searches discounts by code and name', () => {
    const component = TestBed.runInInjectionContext(
      () => new SettingsDiscountsComponent()
    );

    component.onSearch('summer');

    expect(discountService.getAll).toHaveBeenCalledWith(
      [
        { propName: 'Code', searchValue: 'summer' },
        { propName: 'Name', searchValue: 'summer' },
      ],
      undefined
    );
  });
});


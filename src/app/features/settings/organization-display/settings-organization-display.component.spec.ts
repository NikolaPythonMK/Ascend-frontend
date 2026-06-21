import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { BusinessProfile } from '../../../core/models/api/responses/business-profile.model';
import { OrganizationPreferences } from '../../../core/models/api/responses/organization-preferences.model';
import { Currency } from '../../../core/models/enums/currency.enum';
import { Language } from '../../../core/models/enums/language.enum';
import { TableView } from '../../../core/models/enums/table-view.enum';
import { TaxCalculationMode } from '../../../core/models/enums/tax-calculation-mode.enum';
import { EmployeeStore } from '../../../core/store/employee.store';
import { OrganizationPreferencesService } from '../../../core/services/api/organization-preferences.service';
import { SettingsManagerService } from '../../../core/services/utility/settings-manager.service';
import { SnackbarService } from '../../../core/services/utility/snackbar.service';
import TranslationService from '../../../core/services/utility/translation.service';
import { SettingsOrganizationDisplayComponent } from './settings-organization-display.component';

describe('SettingsOrganizationDisplayComponent', () => {
  it('applies a saved organization language immediately', () => {
    const businessProfile: BusinessProfile = {
      organizationId: 1,
      legalName: 'Test',
      taxId: null,
      phoneNumber: '',
      email: '',
      currency: Currency.EUR,
      // receiptLanguage: Language.En,
    };
    const preferences: OrganizationPreferences = {
      organizationId: 1,
      language: Language.En,
      canEditOtherTables: false,
      canRemoveTableItems: false,
      displayTaxAmount: true,
      logoutAfterTransaction: false,
      defaultTableView: TableView.Table,
      displayStaffNameOnTables: true,
      taxCalculationMode: TaxCalculationMode.Inclusive,
    };
    const settingsManager = new SettingsManagerService();
    settingsManager.setUpOrganizationSettings(businessProfile, preferences);
    settingsManager.setUpStaffSettings({
      staffId: 10,
      organizationId: 1,
      language: Language.Default,
      defaultTableView: TableView.Grid,
    });

    const preferencesService = jasmine.createSpyObj<OrganizationPreferencesService>(
      'OrganizationPreferencesService',
      ['update']
    );
    preferencesService.update.and.returnValue(of(preferences));
    const translationService = jasmine.createSpyObj<TranslationService>(
      'TranslationService',
      ['applyConfiguredLanguage', 'getTranslationForKey']
    );
    translationService.getTranslationForKey.and.returnValue('Successfully');

    TestBed.configureTestingModule({
      providers: [
        { provide: SettingsManagerService, useValue: settingsManager },
        { provide: OrganizationPreferencesService, useValue: preferencesService },
        { provide: EmployeeStore, useValue: { code: signal('1234') } },
        {
          provide: SnackbarService,
          useValue: { success: jasmine.createSpy(), error: jasmine.createSpy() },
        },
        { provide: TranslationService, useValue: translationService },
      ],
    });

    const component = TestBed.runInInjectionContext(
      () => new SettingsOrganizationDisplayComponent()
    );
    component.ngOnInit();

    expect(
      component.dropdownOptions().find(
        (option) => option.id === 'defaultTableView'
      )?.selectedValue
    ).toBe(TableView.Table);

    component.selectOption('language', Language.Mk);
    component.selectOption('defaultTableView', TableView.Draggable);
    component.onSubmit();

    expect(settingsManager.organizationPreferences()?.language).toBe(Language.Mk);
    expect(settingsManager.organizationPreferences()?.defaultTableView).toBe(
      TableView.Draggable
    );
    expect(translationService.applyConfiguredLanguage).toHaveBeenCalled();
  });
});

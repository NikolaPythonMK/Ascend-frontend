import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Language } from '../../../core/models/enums/language.enum';
import { TableView } from '../../../core/models/enums/table-view.enum';
import { EmployeeStore } from '../../../core/store/employee.store';
import { StaffPreferencesService } from '../../../core/services/api/staff-preferences.service';
import { SettingsManagerService } from '../../../core/services/utility/settings-manager.service';
import { SnackbarService } from '../../../core/services/utility/snackbar.service';
import TranslationService from '../../../core/services/utility/translation.service';
import { SettingsStaffDisplayComponent } from './settings-staff-preferences.component';

describe('SettingsStaffDisplayComponent', () => {
  it('applies all saved staff preferences immediately', () => {
    const settingsManager = new SettingsManagerService();
    settingsManager.setUpStaffSettings({
      staffId: 10,
      organizationId: 1,
      language: Language.En,
      defaultTableView: TableView.Table,
    });

    const preferencesService = jasmine.createSpyObj<StaffPreferencesService>(
      'StaffPreferencesService',
      ['update']
    );
    preferencesService.update.and.returnValue(
      of({
        staffId: 10,
        organizationId: 1,
        language: Language.En,
        defaultTableView: TableView.Table,
      })
    );
    const translationService = jasmine.createSpyObj<TranslationService>(
      'TranslationService',
      ['applyConfiguredLanguage', 'getTranslationForKey']
    );
    translationService.getTranslationForKey.and.returnValue('Successfully');

    TestBed.configureTestingModule({
      providers: [
        { provide: SettingsManagerService, useValue: settingsManager },
        { provide: StaffPreferencesService, useValue: preferencesService },
        { provide: EmployeeStore, useValue: { code: signal('1234') } },
        {
          provide: SnackbarService,
          useValue: { success: jasmine.createSpy(), error: jasmine.createSpy() },
        },
        { provide: TranslationService, useValue: translationService },
      ],
    });

    const component = TestBed.runInInjectionContext(
      () => new SettingsStaffDisplayComponent()
    );
    component.ngOnInit();
    component.selectOption('language', Language.Mk);
    component.selectOption('defaultTableView', TableView.Grid);
    component.onSubmit();

    expect(settingsManager.staffPreferences()).toEqual({
      staffId: 10,
      organizationId: 1,
      language: Language.Mk,
      defaultTableView: TableView.Grid,
    });
    expect(translationService.applyConfiguredLanguage).toHaveBeenCalled();
  });
});

import { Component, OnInit, inject, signal } from "@angular/core";
import { LoaderComponent } from "../../../core/ui/loader/loader.component";
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import { TableView } from "../../../core/models/enums/table-view.enum";
import { Language } from "../../../core/models/enums/language.enum";
import { TaxCalculationMode } from "../../../core/models/enums/tax-calculation-mode.enum";
import { SettingsManagerService } from "../../../core/services/utility/settings-manager.service";
import type { OrganizationPreferences } from "../../../core/models/api/responses/organization-preferences.model";
import { ButtonComponent } from "../../../core/ui/button/button.component";
import { OrganizationPreferencesRequest } from "../../../core/models/api/requests/organization-preferences.request";
import { EmployeeStore } from "../../../core/store/employee.store";
import { OrganizationPreferencesService } from "../../../core/services/api/organization-preferences.service";
import { HttpErrorResponse } from "@angular/common/http";
import { SnackbarService } from "../../../core/services/utility/snackbar.service";
import { finalize } from "rxjs";
import { TranslateModule } from "@ngx-translate/core";
import TranslationService from "../../../core/services/utility/translation.service";

interface SettingOption {
  id: string;
  label: string;
  enabled: boolean;
}

interface DropdownOption<T> {
  id: string;
  label: string;
  selectedValue: T;
  options: Array<{ value: T; label: string }>;
}

@Component({
  selector: 'settings-organization-display',
  imports: [LoaderComponent, MatSlideToggleModule, ButtonComponent, TranslateModule],
  templateUrl: 'settings-organization-display.component.html',
  styleUrls: ['settings-organization-display.component.scss', '../style.scss'],
  standalone: true
})
export class SettingsOrganizationDisplayComponent implements OnInit {
  private readonly settingsManager = inject(SettingsManagerService);
  private readonly employee = inject(EmployeeStore);
  private readonly organizationPreferencesService = inject(OrganizationPreferencesService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly translationService = inject(TranslationService);

  private openDropdownId = signal<string | null>(null);

  settingsOptions = signal<SettingOption[]>([]);
  dropdownOptions = signal<DropdownOption<number>[]>([]);

  private organizationId = 0; // keep identity for payload
  loading = signal(false);

  private readonly languageOptions = [
    { value: Language.En, label: 'settings.preferences.options.english' },
    { value: Language.Mk, label: 'settings.preferences.options.macedonian' },
  ];

  private readonly tableViewOptions = [
    { value: TableView.Table,     label: 'settings.preferences.options.table' },
    { value: TableView.Grid,      label: 'settings.preferences.options.grid' },
    { value: TableView.Draggable, label: 'settings.preferences.options.draggable' },
  ];

  private readonly taxCalculationModeOptions = [
    { value: TaxCalculationMode.Inclusive, label: 'settings.preferences.options.taxInclusive' },
    { value: TaxCalculationMode.Additive, label: 'settings.preferences.options.taxAdditive' },
  ];

  ngOnInit(): void {
    // If this is async/signal in your app, subscribe/effect and call initFrom(prefs).
    const prefs = this.settingsManager.organizationPreferences()!;
    this.initFrom(prefs);
  }

  private initFrom(prefs: OrganizationPreferences): void {
    this.organizationId = prefs.organizationId;

    // Dropdowns (use service getters if you keep user-level overrides there)
    this.dropdownOptions.set([
      {
        id: 'language',
        label: 'settings.preferences.language',
        selectedValue: prefs.language,
        options: this.languageOptions
      },
      {
        id: 'defaultTableView',
        label: 'settings.preferences.defaultTableView',
        selectedValue: prefs.defaultTableView,
        options: this.tableViewOptions
      },
      {
        id: 'taxCalculationMode',
        label: 'settings.preferences.taxCalculationMode',
        selectedValue: prefs.taxCalculationMode,
        options: this.taxCalculationModeOptions
      }
    ]);

    // Toggles
    this.settingsOptions.set([
      { id: 'canEditOtherTables',       label: 'settings.preferences.allowEditingOtherTables',   enabled: prefs.canEditOtherTables },
      { id: 'canRemoveTableItems',      label: 'settings.preferences.allowRemovingTableItems',   enabled: prefs.canRemoveTableItems },
      { id: 'displayTaxAmount',         label: 'settings.preferences.displayTaxAmount',           enabled: prefs.displayTaxAmount },
      { id: 'logoutAfterTransaction',   label: 'settings.preferences.logoutAfterTransaction',     enabled: prefs.logoutAfterTransaction },
      { id: 'displayStaffNameOnTables', label: 'settings.preferences.displayStaffNameOnTables', enabled: prefs.displayStaffNameOnTables },
    ]);
  }

  // ---------- helpers to read UI state ----------
  private selectedValue<T extends number>(id: string): T {
    const opt = this.dropdownOptions().find(o => o.id === id);
    return (opt?.selectedValue as T)!;
  }
  private toggleValue(id: string): boolean {
    const t = this.settingsOptions().find(o => o.id === id);
    return !!t?.enabled;
  }

  private buildPayload(): OrganizationPreferencesRequest {
    return {
      organizationId: this.organizationId,
      language: this.selectedValue<Language>('language'),
      defaultTableView: this.selectedValue<TableView>('defaultTableView'),
      taxCalculationMode: this.selectedValue<TaxCalculationMode>('taxCalculationMode'),

      canEditOtherTables:      this.toggleValue('canEditOtherTables'),
      canRemoveTableItems:     this.toggleValue('canRemoveTableItems'),
      displayTaxAmount:        this.toggleValue('displayTaxAmount'),
      logoutAfterTransaction:  this.toggleValue('logoutAfterTransaction'),
      displayStaffNameOnTables:this.toggleValue('displayStaffNameOnTables'),

      code: this.employee.code()!
    }
  }

  // ---------- dropdown ui ----------
  toggleDropdown(id: string): void {
    this.openDropdownId.update(currentId => currentId === id ? null : id);
  }
  isDropdownOpen(id: string): boolean {
    return this.openDropdownId() === id;
  }
  selectOption(dropdownId: string, value: number): void {
    this.dropdownOptions.update(options =>
      options.map(option =>
        option.id === dropdownId ? { ...option, selectedValue: value } : option
      )
    );
    this.openDropdownId.set(null);
  }
  updateDropdownValue(id: string, value: number): void {
    this.dropdownOptions.update(options =>
      options.map(option => option.id === id ? { ...option, selectedValue: value } : option)
    );
  }
  getSelectedLabel(option: DropdownOption<any>): string {
    const selectedOption = option.options.find(opt => opt.value === option.selectedValue);
    return selectedOption?.label ?? '';
  }

  // ---------- toggles ui ----------
  toggleSetting(id: string): void {
    this.settingsOptions.update(options =>
      options.map(option => option.id === id ? { ...option, enabled: !option.enabled } : option)
    );
  }

  // ---------- submit/persist ----------
  onSubmit(): void {
    const payload = this.buildPayload();
    console.log(payload);

    this.loading.set(true);
    this.organizationPreferencesService.update(payload)
    .pipe(finalize(() => this.loading.set(false)))
    .subscribe({
      next: () => {
        const businessProfile = this.settingsManager.businessProfile();
        if (businessProfile) {
          const updatedPreferences: OrganizationPreferences = {
            organizationId: payload.organizationId,
            language: payload.language,
            defaultTableView: payload.defaultTableView,
            taxCalculationMode: payload.taxCalculationMode,
            canEditOtherTables: payload.canEditOtherTables,
            canRemoveTableItems: payload.canRemoveTableItems,
            displayTaxAmount: payload.displayTaxAmount,
            logoutAfterTransaction: payload.logoutAfterTransaction,
            displayStaffNameOnTables: payload.displayStaffNameOnTables,
          };

          this.settingsManager.setUpOrganizationSettings(
            businessProfile,
            updatedPreferences
          );
          this.translationService.applyConfiguredLanguage();
        }
        this.snackbarService.success(
          this.translationService.getTranslationForKey('shared.successfully')
        );
      },
      error: (error: HttpErrorResponse) => {
        this.snackbarService.error(error.error.message);
      }
    })
  }
}

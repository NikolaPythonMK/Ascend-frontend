import { Component, OnInit, inject, signal } from "@angular/core";
import { MatTabsModule } from "@angular/material/tabs";
import { TranslateModule } from "@ngx-translate/core";
import { LoaderComponent } from "../../../core/ui/loader/loader.component";
import { TableComponent } from "../../tables/components/table/table.component";
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelect } from "@angular/material/select";
import { MatSelectModule } from '@angular/material/select';

import { TableView } from "../../../core/models/enums/table-view.enum";
import { Language } from "../../../core/models/enums/language.enum";
import { Theme } from "../../../core/models/enums/theme.enum";
import { SettingsManagerService } from "../../../core/services/utility/settings-manager.service";
import type { OrganizationPreferences } from "../../../core/models/api/responses/organization-preferences.model";
import { ButtonComponent } from "../../../core/ui/button/button.component";
import { OrganizationPreferencesRequest } from "../../../core/models/api/requests/organization-preferences.request";
import { EmployeeStore } from "../../../core/store/employee.store";
import { OrganizationPreferencesService } from "../../../core/services/api/organization-preferences.service";
import { HttpErrorResponse } from "@angular/common/http";
import { SnackbarService } from "../../../core/services/utility/snackbar.service";
import { finalize } from "rxjs";

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
  imports: [MatTabsModule, TableComponent, LoaderComponent, TranslateModule, MatSlideToggleModule, MatSelect, MatSelectModule, ButtonComponent],
  templateUrl: 'settings-organization-display.component.html',
  styleUrls: ['settings-organization-display.component.scss', '../style.scss'],
  standalone: true
})
export class SettingsOrganizationDisplayComponent implements OnInit {
  private readonly settingsManager = inject(SettingsManagerService);
  private readonly employee = inject(EmployeeStore);
  private readonly organizationPreferencesService = inject(OrganizationPreferencesService);
  private readonly snackbarService = inject(SnackbarService);

  private openDropdownId = signal<string | null>(null);

  settingsOptions = signal<SettingOption[]>([]);
  dropdownOptions = signal<DropdownOption<number>[]>([]);

  private organizationId = 0; // keep identity for payload
  loading = signal(false);

  private readonly languageOptions = [
    { value: Language.En, label: 'English' },
    { value: Language.Mk, label: 'Macedonian' },
  ];

  private readonly themeOptions = [
    { value: Theme.Light, label: 'Light' },
    { value: Theme.Dark,  label: 'Dark'  },
  ];

  private readonly tableViewOptions = [
    { value: TableView.Table,     label: 'Table' },
    { value: TableView.Grid,      label: 'Grid' },
    { value: TableView.Draggable, label: 'Draggable' },
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
        label: 'Language',
        selectedValue: (this.settingsManager as any).getLanguage?.() ?? prefs.language,
        options: this.languageOptions
      },
      {
        id: 'theme',
        label: 'Theme',
        selectedValue: (this.settingsManager as any).getTheme?.() ?? prefs.theme,
        options: this.themeOptions
      },
      {
        id: 'defaultTableView',
        label: 'Default table view',
        selectedValue: (this.settingsManager as any).getDefaultTableView?.() ?? prefs.defaultTableView,
        options: this.tableViewOptions
      }
    ]);

    // Toggles
    this.settingsOptions.set([
      { id: 'canEditOtherTables',       label: 'Allow editing other tables',   enabled: prefs.canEditOtherTables },
      { id: 'canRemoveTableItems',      label: 'Allow removing table items',   enabled: prefs.canRemoveTableItems },
      { id: 'displayTaxAmount',         label: 'Display tax amount',           enabled: prefs.displayTaxAmount },
      { id: 'logoutAfterTransaction',   label: 'Logout after transaction',     enabled: prefs.logoutAfterTransaction },
      { id: 'displayStaffNameOnTables', label: 'Display staff name on tables', enabled: prefs.displayStaffNameOnTables },
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
      theme: this.selectedValue<Theme>('theme'),
      defaultTableView: this.selectedValue<TableView>('defaultTableView'),

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
      next: (response: OrganizationPreferences) => {
        this.snackbarService.success('Successfully');
      },
      error: (error: HttpErrorResponse) => {
        this.snackbarService.error(error.error.message);
      }
    })
  }
}

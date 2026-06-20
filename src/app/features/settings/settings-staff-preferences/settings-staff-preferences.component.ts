import { Component, OnInit, inject, signal } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";
import { SettingsManagerService } from "../../../core/services/utility/settings-manager.service";
import { TableView } from "../../../core/models/enums/table-view.enum";
import { Language } from "../../../core/models/enums/language.enum";
import { Theme } from "../../../core/models/enums/theme.enum";
import { ButtonComponent } from "../../../core/ui/button/button.component";
import { StaffPreferencesRequest } from "../../../core/models/api/requests/staff-preferences.request";
import { EmployeeStore } from "../../../core/store/employee.store";
import { StaffPreferencesService } from "../../../core/services/api/staff-preferences.service";
import { finalize } from "rxjs";
import { SnackbarService } from "../../../core/services/utility/snackbar.service";
import { HttpErrorResponse } from "@angular/common/http";
import TranslationService from "../../../core/services/utility/translation.service";

export interface StaffPreferences {
  staffId: number;
  organizationId: number;
  language: Language;
  theme: Theme;
  defaultTableView: TableView;
}

interface DropdownOption<T> {
  id: string;
  label: string;
  selectedValue: T;
  options: Array<{ value: T; label: string }>;
}

@Component({
  selector: "settings-staff-preferences",
  standalone: true,
  imports: [TranslateModule, ButtonComponent],
  templateUrl: "settings-staff-preferences.component.html",
  styleUrls: ["settings-staff-preferences.component.scss", "../style.scss"]
})
export class SettingsStaffDisplayComponent implements OnInit {
  private readonly settingsManager = inject(SettingsManagerService);
  private readonly staff = inject(EmployeeStore);
  private readonly staffPreferencesService = inject(StaffPreferencesService);
  private readonly snackbarSettings = inject(SnackbarService);
  private readonly translationService = inject(TranslationService);

  // UI state
  private openDropdownId = signal<string | null>(null);

  // View-model
  dropdownOptions = signal<DropdownOption<number>[]>([]);

  // Keep identity so we can post a full payload
  private staffId = 0;
  private organizationId = 0;
  loading = signal(false);

  // Option sources
  private readonly languageOptions: Array<{ value: Language; label: string }> = [
    { value: Language.En, label: "settings.preferences.options.english" },
    { value: Language.Mk, label: "settings.preferences.options.macedonian" },
  ];

  private readonly themeOptions: Array<{ value: Theme; label: string }> = [
    { value: Theme.Light, label: "settings.preferences.options.light" },
    { value: Theme.Dark,  label: "settings.preferences.options.dark"  },
  ];

  private readonly tableViewOptions: Array<{ value: TableView; label: string }> = [
    { value: TableView.Default,   label: "settings.preferences.options.default" },
    { value: TableView.Table,     label: "settings.preferences.options.table" },
    { value: TableView.Grid,      label: "settings.preferences.options.grid" },
    { value: TableView.Draggable, label: "settings.preferences.options.draggable" },
  ];

  ngOnInit(): void {
    // If this returns an Observable/signal, subscribe/use effect() then call initFrom(prefs)
    const prefs: StaffPreferences = this.settingsManager.staffPreferences()!;
    this.initFrom(prefs);
  }

  private initFrom(prefs: StaffPreferences): void {
    this.staffId = prefs.staffId;
    this.organizationId = prefs.organizationId;

    this.dropdownOptions.set([
      {
        id: "language",
        label: "settings.preferences.language",
        selectedValue: this.settingsManager.getLanguage() ?? prefs.language,
        options: this.languageOptions
      },
      {
        id: "theme",
        label: "settings.preferences.theme",
        selectedValue: this.settingsManager.getTheme() ?? prefs.theme,
        options: this.themeOptions
      },
      {
        id: "defaultTableView",
        label: "settings.preferences.defaultTableView",
        selectedValue: this.settingsManager.getDefaultTableView() ?? prefs.defaultTableView,
        options: this.tableViewOptions
      }
    ]);
  }

  // Helpers
  private selectedValue<T extends number>(id: string): T {
    const opt = this.dropdownOptions().find(o => o.id === id);
    return (opt?.selectedValue as T)!;
  }

  private buildPayload(): StaffPreferencesRequest {
    return {
      staffId: this.staffId,
      organizationId: this.organizationId,
      language: this.selectedValue<Language>("language"),
      theme: this.selectedValue<Theme>("theme"),
      defaultTableView: this.selectedValue<TableView>("defaultTableView"),
      code: this.staff.code()!
    };
  }

  // Dropdown handlers
  toggleDropdown(id: string): void {
    this.openDropdownId.update(current => current === id ? null : id);
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
      options.map(option =>
        option.id === id ? { ...option, selectedValue: value } : option
      )
    );
  }
  getSelectedLabel(option: DropdownOption<any>): string {
    const selected = option.options.find(o => o.value === option.selectedValue);
    return selected?.label ?? "";
  }

  // Submit / persist
  onSubmit(): void {
    const payload = this.buildPayload();
    console.log(payload);

    this.loading.set(true);
    this.staffPreferencesService.update(payload).pipe(
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: (response: StaffPreferences) => {
        this.staffPreferencesService.getById(this.staffId).subscribe({
          next: (staffPreferences: StaffPreferences) => {
            console.log('response: ', staffPreferences)
            this.settingsManager.setUpStaffSettings(staffPreferences);
            this.translationService.applyConfiguredLanguage();
            this.snackbarSettings.success(
              this.translationService.getTranslationForKey('shared.successfully')
            );

          },
          error: (error: HttpErrorResponse) => {
            this.snackbarSettings.error(error.error.message)
          }
        })
      },
      error: (error: HttpErrorResponse) => {
        this.snackbarSettings.error(error.error.message)
      }
    })

    // const maybeAny = this.settingsManager as any;

    // if (typeof maybeAny.updateStaffPreferences === "function") {
    //   maybeAny.updateStaffPreferences(payload);
    // } else {
    //   maybeAny.setLanguage?.(payload.language);
    //   maybeAny.setTheme?.(payload.theme);
    //   maybeAny.setDefaultTableView?.(payload.defaultTableView);
    //   maybeAny.setStaffPreferences?.(payload);
    // }
  }
}

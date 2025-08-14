import { Component, OnInit, inject, signal } from '@angular/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { SettingsManagerService } from '../../../core/services/utility/settings-manager.service';

import { TaxCalculationMode } from '../../../core/models/enums/tax-calculation-mode.enum';
import { TaxSourcingMode } from '../../../core/models/enums/tax-sourcing-mode.enum';
import { RoundingStrategy } from '../../../core/models/enums/rounding-strategy.enum';
import { ServiceChargeTaxBehavior } from '../../../core/models/enums/service-charge-tax-behavior.enum';
import { TaxCompliance } from '../../../core/models/api/responses/tax-compliance.model';
import { ButtonComponent } from "../../../core/ui/button/button.component";
import { TaxComplianceRequest } from '../../../core/models/api/requests/tax-compliance.request';
import { EmployeeStore } from '../../../core/store/employee.store';
import { TaxComplianceService } from '../../../core/services/api/tax-compliance.service';

interface SettingOption { id: string; label: string; enabled: boolean; }
interface DropdownOption<T> {
  id: string; label: string; selectedValue: T;
  options: Array<{ value: T; label: string }>;
}
interface NumberOption {
  id: string; label: string; value: number; step?: number; min?: number; max?: number;
}

@Component({
  selector: 'settings-tax-compliance',
  standalone: true,
  imports: [MatSlideToggleModule, ButtonComponent],
  templateUrl: 'settings-tax-compliance.component.html',
  styleUrls: ['settings-tax-compliance.component.scss', '../style.scss'],
})
export class SettingsTaxComplianceComponent implements OnInit {
  private readonly settingsManager = inject(SettingsManagerService);
  private readonly employee = inject(EmployeeStore);
  private readonly taxComplianceService = inject(TaxComplianceService);
  

  private openDropdownId = signal<string | null>(null);

  dropdownOptions = signal<DropdownOption<number>[]>([]);
  settingsOptions = signal<SettingOption[]>([]);
  numberOptions   = signal<NumberOption[]>([]);

  private organizationId = 0; // keep identity for payload

  // Enum options
  private readonly calculationModeOpts = [
    { value: TaxCalculationMode.Inclusive, label: 'Inclusive (tax-in)' },
    { value: TaxCalculationMode.Additive,  label: 'Additive (tax-out)' },
  ];
  private readonly sourcingModeOpts = [
    { value: TaxSourcingMode.Destination, label: 'Destination' },
    { value: TaxSourcingMode.Origin,      label: 'Origin' },
  ];
  private readonly roundingStrategyOpts = [
    { value: RoundingStrategy.HalfUp,  label: 'Rounding: Half up' },
    { value: RoundingStrategy.Bankers, label: "Rounding: Banker’s" },
  ];
  private readonly serviceChargeBehaviorOpts = [
    { value: ServiceChargeTaxBehavior.BeforeTax, label: 'Service charge before tax' },
    { value: ServiceChargeTaxBehavior.AfterTax,  label: 'Service charge after tax' },
  ];

  ngOnInit(): void {
    const prefs: TaxCompliance = this.settingsManager.taxCompliance()!;

    this.organizationId = prefs.organizationId;

    // Dropdowns
    this.dropdownOptions.set([
      { id: 'calculationMode',     label: 'Calculation mode',      selectedValue: prefs.calculationMode,     options: this.calculationModeOpts },
      { id: 'sourcingMode',        label: 'Tax sourcing',          selectedValue: prefs.sourcingMode,        options: this.sourcingModeOpts },
      { id: 'roundingStrategy',    label: 'Rounding strategy',     selectedValue: prefs.roundingStrategy,    options: this.roundingStrategyOpts },
      { id: 'serviceChargeBehavior', label: 'Service charge behavior', selectedValue: prefs.serviceChargeBehavior, options: this.serviceChargeBehaviorOpts },
    ]);

    // Toggles
    this.settingsOptions.set([
      { id: 'allowMultiComponentTaxes', label: 'Allow multi-component taxes', enabled: prefs.allowMultiComponentTaxes },
      { id: 'enableCashRounding',       label: 'Enable cash rounding',        enabled: prefs.enableCashRounding },
      { id: 'enableEcoFee',             label: 'Enable eco fee',              enabled: prefs.enableEcoFee },
      { id: 'enableMarginScheme',       label: 'Enable margin scheme',        enabled: prefs.enableMarginScheme },
      { id: 'enableRateScheduling',     label: 'Enable rate scheduling',      enabled: prefs.enableRateScheduling },
    ]);

    // Numbers
    this.numberOptions.set([
      { id: 'cashRoundingIncrement',  label: 'Cash rounding increment', value: prefs.cashRoundingIncrement, step: 0.01, min: 0 },
      { id: 'ecoFeeAmount',           label: 'Eco fee amount',          value: prefs.ecoFeeAmount,          step: 0.01, min: 0 },
      { id: 'smallSupplierThreshold', label: 'Small supplier threshold',value: prefs.smallSupplierThreshold, step: 0.01, min: 0 },
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
  private numberValue(id: string): number {
    const n = this.numberOptions().find(o => o.id === id);
    return n?.value ?? 0;
  }

  private buildPayload(): TaxComplianceRequest {
    return {
      organizationId: this.organizationId,

      calculationMode: this.selectedValue<TaxCalculationMode>('calculationMode'),
      sourcingMode:    this.selectedValue<TaxSourcingMode>('sourcingMode'),
      roundingStrategy:this.selectedValue<RoundingStrategy>('roundingStrategy'),
      serviceChargeBehavior: this.selectedValue<ServiceChargeTaxBehavior>('serviceChargeBehavior'),

      allowMultiComponentTaxes: this.toggleValue('allowMultiComponentTaxes'),
      enableCashRounding:       this.toggleValue('enableCashRounding'),
      enableEcoFee:             this.toggleValue('enableEcoFee'),
      enableMarginScheme:       this.toggleValue('enableMarginScheme'),
      enableRateScheduling:     this.toggleValue('enableRateScheduling'),

      cashRoundingIncrement:  this.numberValue('cashRoundingIncrement'),
      ecoFeeAmount:           this.numberValue('ecoFeeAmount'),
      smallSupplierThreshold: this.numberValue('smallSupplierThreshold'),

      code: this.employee.code()!
    };
  }

  // ---------- dropdown ui ----------
  toggleDropdown(id: string): void {
    this.openDropdownId.update(current => (current === id ? null : id));
  }
  isDropdownOpen(id: string): boolean {
    return this.openDropdownId() === id;
  }
  selectOption(dropdownId: string, value: number): void {
    this.dropdownOptions.update(items =>
      items.map(o => (o.id === dropdownId ? { ...o, selectedValue: value } : o))
    );
    this.openDropdownId.set(null);
  }
  getSelectedLabel(option: DropdownOption<any>): string {
    return option.options.find(o => o.value === option.selectedValue)?.label ?? '';
  }

  // ---------- toggle ui ----------
  toggleSetting(id: string): void {
    this.settingsOptions.update(items =>
      items.map(o => (o.id === id ? { ...o, enabled: !o.enabled } : o))
    );
  }

  // ---------- number ui ----------
  updateNumber(id: string, raw: string): void {
    const val = Number(raw);
    if (Number.isNaN(val)) return;
    this.numberOptions.update(items =>
      items.map(n => (n.id === id ? { ...n, value: val } : n))
    );
  }
  isDisabled(numberId: string): boolean {
    if (numberId === 'cashRoundingIncrement') return !this.getToggle('enableCashRounding');
    if (numberId === 'ecoFeeAmount')         return !this.getToggle('enableEcoFee');
    return false;
  }
  private getToggle(id: string): boolean {
    const opt = this.settingsOptions().find(o => o.id === id);
    return !!opt?.enabled;
  }

  // ---------- submit / persist ----------
  onSubmit(): void {
    const payload = this.buildPayload();
    console.log(payload);
    //const svc: any = this.settingsManager;

    // if (typeof svc.updateTaxCompliance === 'function') {
    //   // If it returns Observable/Promise, handle as per your conventions (subscribe/await)
    //   // svc.updateTaxCompliance(payload).subscribe({...})
    //   svc.updateTaxCompliance(payload);
    //   return;
    // }

    // Fallbacks if you have granular setters
    // svc.setTaxCompliance?.(payload);
    // svc.setTaxCalculationMode?.(payload.calculationMode);
    // svc.setTaxSourcingMode?.(payload.sourcingMode);
    // svc.setRoundingStrategy?.(payload.roundingStrategy);
    // svc.setServiceChargeBehavior?.(payload.serviceChargeBehavior);
    // svc.setAllowMultiComponentTaxes?.(payload.allowMultiComponentTaxes);
    // svc.setEnableCashRounding?.(payload.enableCashRounding);
    // svc.setCashRoundingIncrement?.(payload.cashRoundingIncrement);
    // svc.setEnableEcoFee?.(payload.enableEcoFee);
    // svc.setEcoFeeAmount?.(payload.ecoFeeAmount);
    // svc.setEnableMarginScheme?.(payload.enableMarginScheme);
    // svc.setSmallSupplierThreshold?.(payload.smallSupplierThreshold);
    // svc.setEnableRateScheduling?.(payload.enableRateScheduling);
  }
}

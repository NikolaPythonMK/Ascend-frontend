import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { SettingsTaxesComponent } from "./taxes/settings-taxes.component";
import { TranslateModule } from '@ngx-translate/core';
import { SettingsDiscountsComponent } from './discounts/settings-discounts.component';
import { SettingsBusinessProfileComponent } from "./business-profile/settings-business-profile.component";
import { SettingsOrganizationDisplayComponent } from "./organization-display/settings-organization-display.component";
import { SettingsStaffDisplayComponent } from "./settings-staff-preferences/settings-staff-preferences.component";
import { SettingsTaxComplianceComponent } from "./settings-tax-compliance/settings-tax-compliance.component";
import { PermissionService } from '../../core/services/auth/permission.service';

@Component({
  selector: 'app-site-settings',
  imports: [CommonModule, SettingsTaxesComponent, TranslateModule, SettingsDiscountsComponent, SettingsBusinessProfileComponent, SettingsOrganizationDisplayComponent, SettingsStaffDisplayComponent, SettingsTaxComplianceComponent],
  templateUrl: 'settings.component.html',
  styleUrls: ['settings.component.scss', '../../core/styles/menu-item-page.scss']
})
export class SettingsPage {
  private readonly authz = inject(PermissionService);
  canViewTaxes = computed(() => this.authz.has({ name: '/api/tax/all', method: 'POST' }));
  canViewDiscounts = computed(() => this.authz.has({ name: '/api/discount/all', method: 'POST' }))

  menuItems = [
    'Business Profile',
    'Taxes',
    'Discounts',
    'Organization Display',
    'User Display',
    'Tax Compliance',
    'Hardware & Device Profiles'
  ];
  activeItem = this.menuItems[0];

  visibleMenuItems = computed(() => {
    const canTaxes = this.canViewTaxes();
    const canDiscounts = this.canViewDiscounts();
    return this.menuItems.filter(item =>
      (item !== 'Taxes' || canTaxes) &&
      (item !== 'Discounts' || canDiscounts)
    );
  });
  

  setActive(item: string) {
    this.activeItem = item;
  }
}

import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { SettingsTaxesComponent } from "./taxes/settings-taxes.component";
import { TranslateModule } from '@ngx-translate/core';
import { SettingsDiscountsComponent } from './discounts/settings-discounts.component';
import { SettingsBusinessProfileComponent } from "./business-profile/settings-business-profile.component";
import { SettingsOrganizationDisplayComponent } from "./organization-display/settings-organization-display.component";
import { SettingsStaffDisplayComponent } from "./settings-staff-preferences/settings-staff-preferences.component";
import { PermissionService } from '../../core/services/auth/permission.service';

@Component({
  selector: 'app-site-settings',
  imports: [CommonModule, SettingsTaxesComponent, TranslateModule, SettingsDiscountsComponent, SettingsBusinessProfileComponent, SettingsOrganizationDisplayComponent, SettingsStaffDisplayComponent],
  templateUrl: 'settings.component.html',
  styleUrls: ['settings.component.scss', '../../core/styles/menu-item-page.scss']
})
export class SettingsPage {
  private readonly authz = inject(PermissionService);
  canViewTaxes = computed(() => this.authz.has({ name: '/api/tax/all', method: 'POST' }));
  canViewDiscounts = computed(() => this.authz.has({ name: '/api/discount/all', method: 'POST' }))

  ngOnInit(): void {
    console.log('INIT SETTINGS COMPONENT');
  }

  menuItems = [
    { id: 'businessProfile', label: 'settings.navigation.businessProfile' },
    { id: 'taxes', label: 'settings.navigation.taxes' },
    { id: 'discounts', label: 'settings.navigation.discounts' },
    { id: 'organizationDisplay', label: 'settings.navigation.organizationDisplay' },
    { id: 'userDisplay', label: 'settings.navigation.userDisplay' },
  ];
  activeItem = signal(this.menuItems[0].id);

  visibleMenuItems = computed(() => {
    const canTaxes = this.canViewTaxes();
    const canDiscounts = this.canViewDiscounts();
    return this.menuItems.filter(item =>
      (item.id !== 'taxes' || canTaxes) &&
      (item.id !== 'discounts' || canDiscounts)
    );
  });

  selectedItem = computed(() => {
    const activeItem = this.activeItem();
    const visibleMenuItems = this.visibleMenuItems();

    return visibleMenuItems.some(item => item.id === activeItem)
      ? activeItem
      : visibleMenuItems[0]?.id ?? null;
  });
  

  setActive(itemId: string) {
    this.activeItem.set(itemId);
  }
}

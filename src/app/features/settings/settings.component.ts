import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { SettingsTaxesComponent } from "./taxes/settings-taxes.component";
import { TranslateModule } from '@ngx-translate/core';
import { SettingsDiscountsComponent } from './discounts/settings-discounts.component';

@Component({
  selector: 'app-site-settings',
  imports: [CommonModule, SettingsTaxesComponent, TranslateModule, SettingsDiscountsComponent],
  templateUrl: 'settings.component.html',
  styleUrls: ['settings.component.scss', '../../core/styles/menu-item-page.scss']
})
export class SettingsPage {
  menuItems = [
    'General',
    'Display',
    'Taxes',
    'Discounts',
    'Security',
    'Account',
    'User Connections',
    'Subscription'
  ];
  activeItem = this.menuItems[0];

  setActive(item: string) {
    this.activeItem = item;
  }
}

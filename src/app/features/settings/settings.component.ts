import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { SettingsTaxesComponent } from "./taxes/settings-taxes.component";

@Component({
  selector: 'app-site-settings',
  imports: [CommonModule, SettingsTaxesComponent],
  templateUrl: 'settings.component.html',
  styleUrls: ['settings.component.scss']
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

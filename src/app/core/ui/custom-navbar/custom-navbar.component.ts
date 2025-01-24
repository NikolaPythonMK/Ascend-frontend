import { Component, Input, signal } from "@angular/core";
import { MenuItem } from "./menu-item.model";
import { MatListModule } from '@angular/material/list'
import { MatIconModule } from '@angular/material/icon'
import { RouterModule } from "@angular/router";

@Component({
    selector: 'ascend-custom-navbar',
    imports: [MatListModule, MatIconModule, RouterModule],
    templateUrl: 'custom-navbar.component.html',
    styleUrls: ['custom-navbar.component.scss']
})
export class CustomNavbarComponent {
    sideNavCollapsed = signal(false);
    @Input() set collapsed(val: boolean) {
        this.sideNavCollapsed.set(val);
    }

    menuItems = signal<MenuItem[]>([
        {
            icon: 'table_bar',
            label: 'Tables',
            route: '/123/tables',
        },
        {
            icon: 'fastfood',
            label: 'Products & Categories',
            route: '/123/menu',
        },
        {
            icon: 'pin_drop',
            label: 'Locations',
            route: '/123/locations'
        },
        {
            icon: 'groups',
            label: 'Stuff',
            route: '/123/stuff',
        },
        {
            icon: 'payments',
            label: 'Revenue',
            route: '/123/revenue',
        },
        {
            icon: 'query_stats',
            label: 'Reports & Analysis',
            route: '/123/reports',
        },
        {
            icon: 'inventory_2',
            label: 'Stock',
            route: '/123/stock',
        },
        {
            icon: 'settings',
            label: 'Settings',
            route: '/123/settings',
        },
    ])
}
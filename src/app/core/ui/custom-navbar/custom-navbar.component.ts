import { Component, Input, signal } from "@angular/core";
import { MenuItem } from "./menu-item.model";
import { MatListModule } from '@angular/material/list'
import { MatIconModule } from '@angular/material/icon'
import { RouterModule } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";

@Component({
    selector: 'ascend-custom-navbar',
    imports: [MatListModule, MatIconModule, RouterModule, TranslateModule],
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
            label: 'navbar-items.tables',
            route: '/123/tables',
        },
        {
            icon: 'fastfood',
            label: 'navbar-items.products-categories',
            route: '/123/menu',
        },
        {
            icon: 'pin_drop',
            label: 'navbar-items.locations',
            route: '/123/locations'
        },
        {
            icon: 'groups',
            label: 'navbar-items.stuff',
            route: '/123/stuff',
        },
        {
            icon: 'payments',
            label: 'navbar-items.revenue',
            route: '/123/revenue',
        },
        {
            icon: 'query_stats',
            label: 'navbar-items.reports-analysis',
            route: '/123/reports',
        },
        {
            icon: 'inventory_2',
            label: 'navbar-items.stock',
            route: '/123/stock',
        },
        {
            icon: 'settings',
            label: 'navbar-items.settings',
            route: '/123/settings',
        },
    ])
}
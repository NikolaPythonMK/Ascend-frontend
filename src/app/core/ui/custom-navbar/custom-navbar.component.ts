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
            route: '/tables',
        },
        {
            icon: 'fastfood',
            label: 'navbar-items.products-categories',
            route: '/menu',
        },
        {
            icon: 'pin_drop',
            label: 'navbar-items.locations',
            route: '/locations'
        },
        {
            icon: 'groups',
            label: 'navbar-items.staff',
            route: '/personal',
        },
        {
            icon: 'payments',
            label: 'navbar-items.revenue',
            route: '/revenue',
        },
        {
            icon: 'query_stats',
            label: 'navbar-items.reports-analysis',
            route: '/reports',
        },
        {
            icon: 'inventory_2',
            label: 'navbar-items.stock',
            route: '/stock',
        },
        {
            icon: 'settings',
            label: 'navbar-items.settings',
            route: '/settings',
        },
    ])
}
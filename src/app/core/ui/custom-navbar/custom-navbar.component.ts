import { Component, inject, Input, output, signal } from "@angular/core";
import { MenuItem } from "./menu-item.model";
import { MatListModule } from '@angular/material/list'
import { MatIconModule } from '@angular/material/icon'
import { Router, RouterModule } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { CommonModule } from "@angular/common";
import { EmployeeStore } from "../../store/employee.store";
import { SnackbarService } from "../../services/utility/snackbar.service";
import TranslationService from "../../services/utility/translation.service";
import { PermissionService } from "../../services/auth/permission.service";

@Component({
    selector: 'ascend-custom-navbar',
    imports: [MatListModule, MatIconModule, RouterModule, TranslateModule, CommonModule, TranslateModule],
    templateUrl: 'custom-navbar.component.html',
    styleUrls: ['custom-navbar.component.scss']
})
export class CustomNavbarComponent {
    sideNavCollapsed = signal(false);
    countryListOpened = signal(false);
    @Input() set collapsed(val: boolean) {
        this.sideNavCollapsed.set(val);
    }
    staff = inject(EmployeeStore);
    router = inject(Router);
    snackbar = inject(SnackbarService);

    collapseEvent = output<boolean>();
    readonly translationService = inject(TranslationService);
    readonly authz = inject(PermissionService);

    menuItems = signal<MenuItem[]>([
        {
            icon: 'table_bar',
            label: 'navbar-items.tables',
            route: '/tables',
            api: ['/api/table/all']
        },
        {
            icon: 'fastfood',
            label: 'navbar-items.products-categories',
            route: '/menu',
            api: ['/api/product/all', '/api/category/all', '/api/categorygroup/all']
        },
        {
            icon: 'pin_drop',
            label: 'navbar-items.locations',
            route: '/locations',
            api: ['/api/location/all']
        },
        {
            icon: 'groups',
            label: 'navbar-items.staff',
            route: '/personal',
            api: ['/api/staffuser/all', '/api/role/all']
        },
        {
            icon: 'insights',
            label: 'navbar-items.analytics-revenue',
            route: '/analytics-revenue',
            api: ['/api/analytics/revenue/dashboard'],
            method: 'GET'
        },
        // {
        //     icon: 'inventory_2',
        //     label: 'navbar-items.stock',
        //     route: '/stock',
        //     api: []
        // },
        {
            icon: 'settings',
            label: 'navbar-items.settings',
            route: '/settings',
            api: []
        },
    ])

    canView(item: MenuItem): boolean {
        if (item.api.length === 0)
            return true;
        return this.authz.hasAny(
            item.api.map((name) => ({ name, method: item.method ?? 'POST' }))
        );
    }

    onCollapse(): void {
        this.sideNavCollapsed.set(!this.sideNavCollapsed());
        this.collapseEvent.emit(this.sideNavCollapsed());
        if (this.sideNavCollapsed()) {
            this.countryListOpened.set(false);
        }
    }

    logout(): void {
        this.staff.clearStore();
        this.router.navigate(['/staff']);
        this.snackbar.success(this.translationService.getTranslationForKey("auth.logout-succesfull"))
    }
}

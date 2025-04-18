import { Component, inject, Input, output, signal } from "@angular/core";
import { MenuItem } from "./menu-item.model";
import { MatListModule } from '@angular/material/list'
import { MatIconModule } from '@angular/material/icon'
import { Router, RouterModule } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { CountrySelectComponent } from "../country-select/country-select.component";
import { CommonModule } from "@angular/common";
import { EmployeeStore } from "../../store/employee.store";
import { SnackbarService } from "../../services/utility/snackbar.service";

@Component({
    selector: 'ascend-custom-navbar',
    imports: [MatListModule, MatIconModule, RouterModule, TranslateModule, CountrySelectComponent, CommonModule],
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

    onCollapse(): void {
        this.sideNavCollapsed.set(!this.sideNavCollapsed());
        this.collapseEvent.emit(this.sideNavCollapsed());
        if (this.sideNavCollapsed()) {
            this.countryListOpened.set(false);
        }
    }

    onLangSelect(): void {
        this.countryListOpened.set(!this.countryListOpened());
        this.sideNavCollapsed.set(false);
        this.collapseEvent.emit(this.sideNavCollapsed());
    }

    logout(): void {
        this.staff.clearStore();
        this.router.navigate(['/staff']);
        this.snackbar.success('Успешно одјавување')
    }
}

import { CommonModule } from "@angular/common";
import { Component, computed, inject, OnInit, signal } from "@angular/core";
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav'
import { CustomNavbarComponent } from "../../core/ui/custom-navbar/custom-navbar.component";
import { RouterOutlet } from "@angular/router";
import { CountrySelectComponent } from "../../core/ui/country-select/country-select.component";
import { TranslateModule } from "@ngx-translate/core";
import { BreakpointService } from "../../core/services/utility/breakpoint.service";
import { TableStateService } from "../../core/services/utility/table-state.service";

@Component({
    selector: 'ascend-navbar',
    imports: [MatToolbarModule, CommonModule, MatButtonModule, MatIconModule, MatSidenavModule, CustomNavbarComponent, RouterOutlet, TranslateModule],
    templateUrl: 'home.component.html',
    styleUrls: ['home.component.scss']
})
export class HomeComponent implements OnInit{
    collapsed = signal(true);
    sidenavWidth = computed(() => this.collapsed() ? '65px' : '280px');
    mobileSidenavWidth = computed(() => this.collapsed() ? '0px' : '450px');
    tableView = signal<string>('');
    breakpointService = inject(BreakpointService);
    tableStateService = inject(TableStateService);

    ngOnInit(): void {
        this.tableStateService.view.subscribe((value) => {
            this.tableView.set(value)
            console.log('v: ', this.tableView());
        })
    }

    onCollapse(isCollapsed: boolean): void {
        console.log(isCollapsed);
        this.collapsed.set(isCollapsed);
    }

    onCollapseMobile(): void {
        this.collapsed.set(false);
    }
}
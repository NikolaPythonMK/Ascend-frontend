import { CommonModule } from "@angular/common";
import { Component, computed, signal } from "@angular/core";
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav'
import { CustomNavbarComponent } from "../../core/ui/custom-navbar/custom-navbar.component";
import { RouterOutlet } from "@angular/router";
import { CountrySelectComponent } from "../../core/ui/country-select/country-select.component";
import { TranslateModule } from "@ngx-translate/core";

@Component({
    selector: 'ascend-navbar',
    imports: [MatToolbarModule, CommonModule, MatButtonModule, MatIconModule, MatSidenavModule, CustomNavbarComponent, RouterOutlet, CountrySelectComponent, TranslateModule],
    templateUrl: 'home.component.html',
    styleUrls: ['home.component.scss']
})
export class HomeComponent {
    collapsed = signal(true);
    sidenavWidth = computed(() => this.collapsed() ? '65px' : '280px');
}
import { Component } from "@angular/core";
import { MatTabsModule } from "@angular/material/tabs";
import { TranslateModule } from "@ngx-translate/core";
import { CategoriesComponent } from "./tabs/categories-tab/categories.component";
import { ProuctsComponent } from "./tabs/products-tab/products.component";
import { ButtonComponent } from "../../core/ui/button/button.component";
import { CategoryGroupsComponent } from "./tabs/category-groups-tab/category-groups.component";

@Component({
    imports: [MatTabsModule, TranslateModule, CategoriesComponent, ProuctsComponent, ButtonComponent, CategoryGroupsComponent],
    templateUrl: 'menu.component.html',
    styleUrls: ['menu.component.scss', '../../core/styles/menu-item-page.scss']
})
export class MenuPage {

}
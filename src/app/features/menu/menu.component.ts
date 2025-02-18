import { Component } from "@angular/core";
import { MatTabsModule } from "@angular/material/tabs";
import { TranslateModule } from "@ngx-translate/core";
import { CategoriesComponent } from "./tabs/categories-tab/categories.component";
import { ProuctsComponent } from "./tabs/products-tab/products.component";

@Component({
    imports: [MatTabsModule, TranslateModule, CategoriesComponent, ProuctsComponent],
    templateUrl: 'menu.component.html',
    styleUrls: ['menu.component.scss']
})
export class MenuPage {

}
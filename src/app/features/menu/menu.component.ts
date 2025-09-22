import { Component, inject } from "@angular/core";
import { MatTabsModule } from "@angular/material/tabs";
import { TranslateModule } from "@ngx-translate/core";
import { CategoriesComponent } from "./tabs/categories-tab/categories.component";
import { ProuctsComponent } from "./tabs/products-tab/products.component";
import { CategoryGroupsComponent } from "./tabs/category-groups-tab/category-groups.component";
import { PermissionService } from "../../core/services/auth/permission.service";

@Component({
    imports: [MatTabsModule, TranslateModule, CategoriesComponent, ProuctsComponent, CategoryGroupsComponent],
    templateUrl: 'menu.component.html',
    styleUrls: ['menu.component.scss', '../../core/styles/menu-item-page.scss']
})
export class MenuPage {
    authz = inject(PermissionService);

    canViewProducts = this.authz.has({ name: '/api/product/all', method: 'POST' });
    canViewCategories = this.authz.has({ name: '/api/category/all', method: 'POST' });
    canViewCategoryGroups = this.authz.has({ name: '/api/categorygroup/all', method: 'POST' });
}
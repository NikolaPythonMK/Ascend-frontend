import { Component, inject } from "@angular/core";
import {MatTabsModule} from '@angular/material/tabs';
import { TranslateModule } from "@ngx-translate/core";
import { RolesComponent } from "./tabs/roles/roles.component";
import { PersonalComponent } from "./tabs/personal/personal.component";
import { PermissionService } from "../../core/services/auth/permission.service";


@Component({
    imports: [MatTabsModule, TranslateModule, RolesComponent, PersonalComponent],
    templateUrl: 'staff.component.html',
    styleUrls: ['staff.component.scss', '../../core/styles/menu-item-page.scss']
})
export class StaffPage {
    private readonly authz = inject(PermissionService);

    canViewPersonal = this.authz.has({ name: '/api/staffuser/all', method: 'POST' });
    canViewRoles = this.authz.has({ name: '/api/role/all', method: 'POST' });
}
import { Component } from "@angular/core";
import {MatTabsModule} from '@angular/material/tabs';
import { TranslateModule } from "@ngx-translate/core";
import { ButtonComponent } from "../../core/ui/button/button.component";
import { RolesComponent } from "./tabs/roles/roles.component";


@Component({
    imports: [MatTabsModule, TranslateModule, RolesComponent],
    templateUrl: 'staff.component.html',
    styleUrls: ['staff.component.scss']
})
export class StaffPage {

}
import { Component } from "@angular/core";
import {MatTabsModule} from '@angular/material/tabs';
import { TranslateModule } from "@ngx-translate/core";
import { RolesComponent } from "./tabs/roles/roles.component";
import { PersonalComponent } from "./tabs/personal/personal.component";


@Component({
    imports: [MatTabsModule, TranslateModule, RolesComponent, PersonalComponent],
    templateUrl: 'staff.component.html',
    styleUrls: ['staff.component.scss']
})
export class StaffPage {

}
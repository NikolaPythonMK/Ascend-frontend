import { Component, inject } from "@angular/core";
import { MatTabsModule } from "@angular/material/tabs";
import { LoaderComponent } from "../../../core/ui/loader/loader.component";
import { TableComponent } from "../../tables/components/table/table.component";


@Component({
    selector: 'settings-discounts',
    imports: [MatTabsModule, TableComponent, LoaderComponent],
    templateUrl: 'settings-discounts.component.html',
    styleUrls: ['settings-discounts.component.scss', '../style.scss']
})
export class DiscountsComponent {
    
}
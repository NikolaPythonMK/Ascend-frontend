import { Component, inject, input } from "@angular/core";
import { MatIconModule } from "@angular/material/icon";
import { CommonModule } from "@angular/common";
import type { TableItem } from "../../../../core/models/api/responses/table-item.model";
import { TranslateModule } from "@ngx-translate/core";
import { SettingsManagerService } from "../../../../core/services/utility/settings-manager.service";

@Component({
    selector: 'tables-order-items',
    imports: [MatIconModule, CommonModule, TranslateModule],
    templateUrl: 'ordered-items.component.html',
    styleUrls: ['ordered-items.component.scss']
})
export class OrderedItemsComponent {
    readonly settingsManager = inject(SettingsManagerService);
    tableItems = input.required<TableItem[]>();

}

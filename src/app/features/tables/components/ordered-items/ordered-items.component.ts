import { Component, input } from "@angular/core";
import { MatIconModule } from "@angular/material/icon";
import { CommonModule } from "@angular/common";
import type { TableItem } from "../../../../core/models/api/responses/table-item.model";
import { TranslateModule } from "@ngx-translate/core";

@Component({
    selector: 'tables-order-items',
    imports: [MatIconModule, CommonModule, TranslateModule],
    templateUrl: 'ordered-items.component.html',
    styleUrls: ['ordered-items.component.scss']
})
export class OrderedItemsComponent {
tableItems = input.required<TableItem[]>();

}
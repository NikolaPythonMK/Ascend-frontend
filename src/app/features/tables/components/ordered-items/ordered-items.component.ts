import { Component, input } from "@angular/core";
import { Order } from "../../models/order.model";
import { MatIconModule } from "@angular/material/icon";
import { CommonModule } from "@angular/common";
import { TableItem } from "../../../../core/models/api/table-item.model";

@Component({
    selector: 'tables-order-items',
    imports: [MatIconModule, CommonModule],
    templateUrl: 'ordered-items.component.html',
    styleUrls: ['ordered-items.component.scss']
})
export class OrderedItemsComponent {
    tableItems = input.required<TableItem[]>();
}
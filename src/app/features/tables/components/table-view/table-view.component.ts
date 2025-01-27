import { CommonModule } from "@angular/common";
import { Component, input, output } from "@angular/core";
import { MatIconModule } from "@angular/material/icon";
import { MatTableModule } from "@angular/material/table";
import { TranslateModule } from "@ngx-translate/core";
import { Table } from "../../tables.component";

@Component({
    selector: 'table-view',
    imports: [MatTableModule, CommonModule, MatIconModule, TranslateModule],
    templateUrl: 'table-view.component.html',
    styleUrls: ['table-view.component.scss']
})
export class TableViewComponent {
    displayedColumns = ['Table', 'Status', 'Total Price'];
    dataSource = input.required<Table[]>();
    clickedTableId = output<number>();

    handleRowClick(tableId: number): void {
        this.clickedTableId.emit(tableId);
    }
}
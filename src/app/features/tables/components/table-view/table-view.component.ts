import { CommonModule } from "@angular/common";
import { Component, input, output } from "@angular/core";
import { MatIconModule } from "@angular/material/icon";
import { MatTableModule } from "@angular/material/table";
import { TranslateModule } from "@ngx-translate/core";
import { MatButtonModule } from "@angular/material/button";
import { Table } from "../../../../core/models/api/responses/table.model";

@Component({
    selector: 'table-view',
    imports: [MatTableModule, CommonModule, MatIconModule, TranslateModule, MatButtonModule],
    templateUrl: 'table-view.component.html',
    styleUrls: ['table-view.component.scss']
})
export class TableViewComponent {
    displayedColumns = ['tables.column-table', 'tables.column-status', 'tables.column-price', ''];
    dataSource = input.required<Table[]>();
    clickedTableId = output<number>();

    handleRowClick(tableId: number): void {
        this.clickedTableId.emit(tableId);
    }
}
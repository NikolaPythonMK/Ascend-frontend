import { CommonModule } from "@angular/common";
import { Component, input, output } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { TranslateModule } from "@ngx-translate/core";
import { Table } from "../../models/api/table.model";

@Component({
    selector: 'ascend-table',
    imports: [CommonModule, MatIconModule, TranslateModule, MatButtonModule],
    templateUrl: 'table.component.html',
    styleUrls: ['table.component.scss']
})
export class TableComponent {
    //displayedColumns = input<string[]>();
        displayedColumns = ['tables.column-table', 'tables.column-status', 'tables.column-price', ''];
        dataSource = input.required<Table[]>();
        clickedTableId = output<number>();
    
        handleRowClick(tableId: number): void {
            this.clickedTableId.emit(tableId);
        }
}
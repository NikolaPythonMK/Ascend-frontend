import { CommonModule } from "@angular/common";
import { Component, input, output } from "@angular/core";
import { MatIconModule } from "@angular/material/icon";
import { TranslateModule } from "@ngx-translate/core";
import { Table } from "../../tables.component";

@Component({
    selector: 'grid-view',
    imports: [CommonModule, MatIconModule, TranslateModule],
    templateUrl: 'grid-view.component.html',
    styleUrls: ['grid-view.component.scss']
})
export class GridViewComponent {
    dataSource = input.required<Table[]>();
    clickedTableId = output<number>();

    handleRowClick(tableId: number): void {
        this.clickedTableId.emit(tableId);
    }
}
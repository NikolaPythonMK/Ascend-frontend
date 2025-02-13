import { CommonModule } from "@angular/common";
import { Component, input, output, signal } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { TranslateModule } from "@ngx-translate/core";
import { Table } from "../../models/api/table.model";
import { HeaderCounterComponent } from "../header-counter/header-counter.component";
import { SearchBarComponent } from "../search-bar/search-bar.component";
import { ButtonComponent } from "../button/button.component";

@Component({
    selector: 'ascend-table',
    imports: [CommonModule, MatIconModule, TranslateModule, MatButtonModule, HeaderCounterComponent, SearchBarComponent, ButtonComponent],
    templateUrl: 'table.component.html',
    styleUrls: ['table.component.scss']
})
export class TableComponent {
        title = input.required<string>();
        displayedColumns = input.required<string[]>();
        dataRows = input.required<any[]>();
        addEvent = output<void>();

        clickedTableId = output<number>();

        onAddClick(): void {
            this.addEvent.emit();
        }
    
        handleRowClick(tableId: number): void {
            this.clickedTableId.emit(tableId);
        }

        getValues(obj: any): any[] {
            return Object.values(obj);
        }
}
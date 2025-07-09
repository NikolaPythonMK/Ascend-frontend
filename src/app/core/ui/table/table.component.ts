import { CommonModule } from "@angular/common";
import { Component, input, OnInit, output, signal } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { TranslateModule } from "@ngx-translate/core";
import { HeaderCounterComponent } from "../header-counter/header-counter.component";
import { SearchBarComponent } from "../search-bar/search-bar.component";
import { ButtonComponent } from "../button/button.component";
import { SortType } from "./types/sort-type.enum";
import { Sort } from "./models/sort.model";
import { DataRow } from "./models/data-row";

@Component({
    selector: 'ascend-table',
    imports: [CommonModule, MatIconModule, TranslateModule, MatButtonModule, HeaderCounterComponent, SearchBarComponent, ButtonComponent],
    templateUrl: 'table.component.html',
    styleUrls: ['table.component.scss']
})
export class TableComponent {
        title = input.required<string>();
        displayedColumns = input.required<string[]>();
        dataRows = input.required<DataRow[]>();
        nonSortableColumns = input<string[]>([]);
        hasAddBtn = input<boolean>(true);
        hasSearchBar = input<boolean>(true);
        //nonSearchableColumns = input<string[]>([]);

        addEvent = output<void>();
        sortEvent = output<Sort | null>();
        searchEvent = output<string>();
        clickedRowEvent = output<number>();
        clickedTableId = output<number>();

        clickedColumnHeader = signal<string>('');
        currentSort = signal<SortType>(SortType.NONE);
        
        onAddClick(): void {
            this.addEvent.emit();
        }

        onSort(column: string): void {
            if (this.nonSortableColumns().includes(column)) {
                return;
            }
        
            const isSameColumn = this.clickedColumnHeader() === column;
        
            if (isSameColumn) {
                this.currentSort.update(value => (value + 1) % 3);
            } else {
                this.currentSort.set(SortType.ASC);
                this.clickedColumnHeader.set(column);
            }
        
            const newSortType = this.currentSort();
        
            if (newSortType === SortType.NONE) {
                this.sortEvent.emit(null);
                return;
            }
        
            this.sortEvent.emit({
                propName: this.clickedColumnHeader(),
                direction: SortType[newSortType]
            });
        }
        

        onSearch(searchTerm: string): void {
            this.searchEvent.emit(searchTerm);
        }

        onRowClick(row: number): void {
            this.clickedRowEvent.emit(row);
        }

        getValues(obj: any): any[] {
            return Object.values(obj);
        }
}
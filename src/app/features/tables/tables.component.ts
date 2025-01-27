import { CommonModule } from "@angular/common";
import { Component, inject, signal } from "@angular/core";
import { MatIconModule } from "@angular/material/icon";
import { MatTableModule } from "@angular/material/table"
import {
    MAT_DIALOG_DATA,
    MatDialog,
    MatDialogActions,
    MatDialogClose,
    MatDialogContent,
    MatDialogRef,
    MatDialogTitle,
  } from '@angular/material/dialog';
import { TableDialogComponent } from "./components/table-dialog/table-dialog.component";
import { TranslateModule } from "@ngx-translate/core";
import { TableViewComponent } from "./components/table-view/table-view.component";
import { GridViewComponent } from "./components/grid-view/grid-view.component";
import { SearchBarComponent } from "../../core/ui/search-bar/search-bar.component";
import {MatButtonToggleModule} from '@angular/material/button-toggle';

export enum TableStatus {
    available = 'Available',
    occupied = 'Occupied'
}

export interface Table {
    id: number,
    status: TableStatus, 
    totalPrice: number,
    //people?: number,
}

const TABLES: Table[] = [
    {id: 1, status: TableStatus.available, totalPrice: 1500,}, //people: 3},
    {id: 2, status: TableStatus.available, totalPrice: 750,}, //people: 1},
    {id: 3, status: TableStatus.occupied, totalPrice: 2050,}, //people: 4},
    {id: 4, status: TableStatus.available, totalPrice: 550, },//people: 2},
    {id: 5, status: TableStatus.occupied, totalPrice: 1050,}, //people: 2},
    {id: 6, status: TableStatus.available, totalPrice: 2000,}, //people: 3},
    {id: 7, status: TableStatus.available, totalPrice: 150, },//people: 1},
    {id: 8, status: TableStatus.available, totalPrice: 3750,}, //people: 4},
    {id: 9, status: TableStatus.available, totalPrice: 2250, },//people: 3},
    {id: 10, status: TableStatus.available, totalPrice: 1150, },//people: 2},
]



@Component({
    selector: 'ascend-tables',
    imports: [MatTableModule, CommonModule, MatIconModule, TranslateModule, TableViewComponent, GridViewComponent, SearchBarComponent, MatButtonToggleModule ],
    templateUrl: 'tables.component.html',
    styleUrls: ['tables.component.scss']
})
export class TablesComponent {
    displayedColumns = ['Table', 'Status', 'Total Price'];
    dataSource = TABLES;
    readonly dialog = inject(MatDialog);
    isAvailable = true;

    toggleState() {
        this.isAvailable = !this.isAvailable;
      }

    selectedView = signal<string>('table');

    openDialog(tableId: number): void {
        const dialogRef = this.dialog.open(TableDialogComponent, {
            data: {
                id: 1
            }
        });
    }

    handleViewChange(view: string): void {
        this.selectedView.set(view);
    }
}
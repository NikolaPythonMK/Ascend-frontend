import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { TableDialogComponent } from './components/table-dialog/table-dialog.component';
import { TranslateModule } from '@ngx-translate/core';
import { TableViewComponent } from './components/table-view/table-view.component';
import { GridViewComponent } from './components/grid-view/grid-view.component';
import { SearchBarComponent } from '../../core/ui/search-bar/search-bar.component';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { DragViewComponent } from './components/drag-view/drag-view.component';
import { TablesService } from '../../core/services/api/tables.service';
import { HttpErrorResponse } from '@angular/common/http';
import { Table } from '../../core/models/api/responses/table.model';

@Component({
  selector: 'ascend-tables',
  imports: [
    MatTableModule,
    CommonModule,
    MatIconModule,
    TranslateModule,
    TableViewComponent,
    GridViewComponent,
    SearchBarComponent,
    MatButtonToggleModule,
    DragViewComponent,
  ],
  templateUrl: 'tables.component.html',
  styleUrls: ['tables.component.scss'],
})
export class TablesComponent implements OnInit{
  readonly dialog = inject(MatDialog);
  tablesService = inject(TablesService);
  dataSource = signal<Table[]>([]);
  selectedView = signal<string>('table');

  ngOnInit(): void {
    this.tablesService.getTables().subscribe({
      next: (tables: Table[]) => {
        this.dataSource.set(tables);
      },
      error: (error: HttpErrorResponse) => {
        console.log(error);
      }
    })
  }

  openDialog(tableId: number): void {
    const table: Table = this.dataSource().find(i => i.id === tableId)!;
    // const items: TableItem[] = tableItems.filter(i => i.tableID === table.id);
    // const data: DialogData = {
    //   table: table,
    //   items: items
    // }
    const dialogRef = this.dialog.open(TableDialogComponent, {
      data: table
    });
  }

  handleViewChange(view: string): void {
    this.selectedView.set(view);
  }

  onSearchTerm(searchTerm: string) {
    this.tablesService.getTables(searchTerm).subscribe({
      next: (tables: Table[]) => {
        this.dataSource.set(tables);
      },
      error: (error: HttpErrorResponse) => {
        console.log(error);
      } 
    })
  }
}

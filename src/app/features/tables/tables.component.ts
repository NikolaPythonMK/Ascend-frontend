import { CommonModule, ViewportScroller } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { TableViewComponent } from './components/table-view/table-view.component';
import { GridViewComponent } from './components/grid-view/grid-view.component';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { DragViewComponent } from './components/drag-view/drag-view.component';
import { TablesService } from '../../core/services/api/tables.service';
import { HttpErrorResponse } from '@angular/common/http';
import { Table } from '../../core/models/api/responses/table.model';
import { ActivatedRoute, Router } from '@angular/router';
import { SnackbarService } from '../../core/services/utility/snackbar.service';
import { Page } from '../../core/models/api/page.model';
import { TableRequest } from '../../core/models/api/requests/table.request';
import { finalize } from 'rxjs';
import { LoaderComponent } from "../../core/ui/loader/loader.component";
import { BreakpointService } from '../../core/services/utility/breakpoint.service';
import { TableStateService } from '../../core/services/utility/table-state.service';
import { DisplayTablesHeaderComponent } from "./components/display-tables-header/display-tables-header.component";
import TranslationService from '../../core/services/utility/translation.service';
import { SettingsManagerService } from '../../core/services/utility/settings-manager.service';
import { TableView } from '../../core/models/enums/table-view.enum';

@Component({
  selector: 'ascend-tables',
  imports: [
    MatTableModule,
    CommonModule,
    MatIconModule,
    TranslateModule,
    TableViewComponent,
    GridViewComponent,
    MatButtonToggleModule,
    DragViewComponent,
    LoaderComponent,
    DisplayTablesHeaderComponent,
    TranslateModule
],
  templateUrl: 'tables.component.html',
  styleUrls: ['tables.component.scss', '../../core/styles/menu-item-page.scss'],
})
export class TablesComponent implements OnInit{
  readonly dialog = inject(MatDialog);
  tablesService = inject(TablesService);
  snackbarService = inject(SnackbarService);
  tables = signal<Table[]>([]);
  tablesLoading = signal<boolean>(false);
  selectedView = signal<string>('table');
  readonly router = inject(Router);
  readonly route = inject(ActivatedRoute);
  readonly viewportScroller = inject(ViewportScroller);
  readonly breakpointService = inject(BreakpointService);
  readonly tableStateService = inject(TableStateService);
  readonly translationService = inject(TranslationService);
  readonly settingsManager = inject(SettingsManagerService);

  ngOnInit(): void {
    this.viewportScroller.scrollToPosition([0, 0])
    window.scrollY = 0;

    const view = this.route.snapshot.queryParamMap.get('view') || this.getTableViewFromEnum(this.settingsManager.getDefaultTableView());
    this.selectedView.set(view);

    this.getTables();
  }

  handleViewChange(view: string): void {
    this.selectedView.set(view);
    this.tableStateService.view.next(view);
    this.router.navigate([], {
      queryParams: { view: this.selectedView() },
      queryParamsHandling: 'merge',
    });

    this.tableStateService.view.subscribe(view => {
      this.selectedView.set(view);
    })
    
  }

  onSearchTerm(searchTerm: string) {

  }

  onClickTable(id: number): void {
    this.router.navigate(['/tables', id]);
  }


  onUpdatePositions(tables: Table[]): void {
    const request: TableRequest[] = tables.map(i => {
      return {
        id: i.id,
        code: i.code,
        position: i.position
      } as TableRequest
    })
    this.tablesService.updateTablePositions(request).subscribe({
      next: (result: number[]) => {
        this.snackbarService.success(`${this.translationService.getTranslationForKey("shared.succesfully")} ${this.translationService.getTranslationForKey("shared.updated")}`)
        this.getTables();
      },
      error: (error: HttpErrorResponse) => {
        this.snackbarService.error(error.message);
      }
    })
  }

  private getTables(): void {
    this.tablesLoading.set(true);
    this.tablesService.getAll().pipe(
      finalize(() => this.tablesLoading.set(false))
    ) 
    .subscribe({
      next: (result: Page<Table>) => {
        this.tables.set(result.data);
      },
      error: (error: HttpErrorResponse) => {
        this.snackbarService.error(error.message);
      }
    })
  }

  getTableViewFromEnum(view: TableView): string {
    switch (view) {
      case 1:
        return "table"
      case 2:
        return "grid"
      case 3:
        return 'drag';
      default:
        return 'table';
    }
  }
}

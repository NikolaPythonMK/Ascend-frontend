import {
  ChangeDetectionStrategy,
  Component,
  input,
  linkedSignal,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragEnd, DragDropModule } from '@angular/cdk/drag-drop';
import { TranslateModule } from '@ngx-translate/core';
import { Table } from '../../../../core/models/api/responses/table.model';
import { ButtonComponent } from '../../../../core/ui/button/button.component';

@Component({
  selector: 'drag-view',
  imports: [CommonModule, DragDropModule, TranslateModule, ButtonComponent],
  templateUrl: 'drag-view.component.html',
  styleUrls: ['drag-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DragViewComponent {

  dataSource = input.required<Table[]>();
  tables = linkedSignal<Table[]>(() => this.dataSource());
  updatedTables = signal<Table[]>([]);
  clickedTableId = output<number>();
  updatedPermissions: any;
  updatePositionsEvent = output<Table[]>();
  isUpdateMode = signal<boolean>(false);

  getDragPosition(table: Table) {
    return { x: table.position.x || 0, y: table.position.y || 0 };
  }

  onDragEnd(event: CdkDragEnd, table: Table) {
    const { x, y } = event.source.getFreeDragPosition();
    this.tables.set(
      this.tables().map((t) =>
        t.id === table.id ? { ...t, position: { x, y } } : t
      )
    );
    const updatedTable = this.tables().find(i => i.id === table.id)!;
    if (!this.updatedTables().find(i => i.id === table.id)){
      this.updatedTables.set([...this.updatedTables(), updatedTable])
    }
  }

  trackByFn(index: number, table: Table) {
    return table.id;
  }

  onClickTable(id: number): void {
    this.clickedTableId.emit(id);
  }

  onReset(): void {
    this.tables.set(this.dataSource());
    this.updatedTables.set([]);
    this.isUpdateMode.set(false);
  }

  onUpdatePositions(): void {
    this.updatePositionsEvent.emit(this.updatedTables());
    this.updatedTables.set([]);
    this.isUpdateMode.set(false);
  }

  handleUpdateMode(): void {
    this.isUpdateMode.set(true);
  }
}

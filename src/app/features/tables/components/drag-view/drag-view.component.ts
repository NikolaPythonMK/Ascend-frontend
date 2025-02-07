import { Component, input } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CdkDragEnd, DragDropModule } from '@angular/cdk/drag-drop';
import { Table } from "../../../../core/models/api/table.model";

@Component({
    selector: 'drag-view',
    imports: [CommonModule, DragDropModule],
    templateUrl: 'drag-view.component.html',
    styleUrls: ['drag-view.component.scss']
})
export class DragViewComponent {
    dataSource = input.required<Table[]>();
//     tables: Table[] = [
//         {
//             id: 1, name: 'Table 1', x: 50, y: 50,
//             status: TableStatus.available,
//             totalPrice: 0
//         },
//         {
//             id: 2, name: 'Table 2', x: 200, y: 100,
//             status: TableStatus.available,
//             totalPrice: 0
//         },
//       ];
    
    //   onDragEnd(event: CdkDragEnd, table: Table) {
    //     const position = event.source.getFreeDragPosition();
    //     table.x = position.x;
    //     table.y = position.y;
    //   }
// 
}
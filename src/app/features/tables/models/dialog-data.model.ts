import { TableItem } from "../../../core/models/api/table-item.model";
import { Table } from "../../../core/models/api/table.model";

export interface DialogData {
    table: Table,
    items: TableItem[],
}
import { TableItem } from "../responses/table-item.model";

export interface TemporaryTableRequest {
    id?: number,
    name: string | null,
    code: string | null,
    staffUserID: number,
    tableItems: TableItem[]
}
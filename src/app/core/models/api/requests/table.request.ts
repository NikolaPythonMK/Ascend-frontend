import { TablePosition } from "../value-objects/table-position.model";

export interface TableRequest {
    id?: number,
    code: string,
    position: TablePosition
}
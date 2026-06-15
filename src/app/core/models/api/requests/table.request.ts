import { TablePosition } from "../value-objects/table-position.model";

export interface TableRequest {
    id?: number,
    locationID?: number,
    code: string,
    name?: string,
    position: TablePosition
}

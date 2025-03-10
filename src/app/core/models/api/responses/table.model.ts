import { TablePosition } from "../value-objects/table-position.model";

export interface Table {
    id: number,
    code: string,
    status: string,
    totalPrice: number,
    locationID: number,
    staffUserID: number,
    position: TablePosition
}
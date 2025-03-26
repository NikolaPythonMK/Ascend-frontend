import { TablePosition } from "../value-objects/table-position.model";
import { StaffUser } from "./staff-user.model";
import { TableItem } from "./table-item.model";

export interface Table {
    id: number,
    code: string,
    status: string,
    totalPrice: number,
    locationID: number,
    staffUserID: number,
    staffUser: StaffUser,
    position: TablePosition,
    tableItems: TableItem[]
}
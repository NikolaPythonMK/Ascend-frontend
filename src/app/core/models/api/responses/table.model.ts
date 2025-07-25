import { TablePosition } from "../value-objects/table-position.model";
import { StaffUser } from "./staff-user.model";
import { TableItem } from "./table-item.model";

export interface Table {
    id: number,
    code: string,
    status: string,
    locationID: number,
    staffUserID: number,
    totalGrossPrice: number,
    totalNetPrice: number,
    totalTaxAmount: number,
    staffUser: StaffUser,
    position: TablePosition,
    tableItems: TableItem[]
}
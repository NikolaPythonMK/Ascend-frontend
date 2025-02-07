import { Table } from "./table.model";

export interface StaffUser {
    id: number | null,
    code: string | null,
    name: string | null,
    tables: Table[] | null,
    staffUserRoles: any[] | null,
    transactions: any[] | null,
}
import { StaffPreferences } from "./staff-preferences.model";
import { Table } from "./table.model";

export interface StaffUser {
    id: number | null,
    code: string | null,
    name: string | null,
    lastName: string | null,
    phoneNumber?: string | null,
    tables: Table[] | null,
    staffUserRoles: any[] | null,
    transactions: any[] | null,
    staffPreferences: StaffPreferences | null
}
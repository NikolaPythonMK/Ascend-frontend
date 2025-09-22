import { StaffPreferences } from "./staff-preferences.model";
import { StaffUserRole } from "./staff-user-role.model";
import { Table } from "./table.model";

export interface StaffUser {
    id: number | null,
    code: string | null,
    name: string | null,
    lastName: string | null,
    phoneNumber?: string | null,
    tables: Table[] | null,
    staffUserRoles: StaffUserRole[] | null,
    transactions: any[] | null,
    staffPreferences: StaffPreferences | null
}
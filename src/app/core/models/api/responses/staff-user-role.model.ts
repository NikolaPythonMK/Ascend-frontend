import { Permission } from "./permission.model"
export interface StaffUserRole {
    permissions: Permission[],
    name: string,
    id: number,
    description: string
}
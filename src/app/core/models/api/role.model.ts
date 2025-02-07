import { Permission } from "./permission.model";

export interface Role {
    id: number,
    name: string,
    description: string,
    rolePermissions: Permission[]
    permissions?: Permission[]
}
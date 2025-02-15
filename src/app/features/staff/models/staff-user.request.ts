export interface StaffUserRequest {
    id: number | null,
    name: string,
    code: string,
    staffUserRoles: number[]
}
export interface StaffUserRequest {
    id: number | null,
    name: string,
    lastName?: string,
    phoneNumber?: string,
    code?: string,
    staffUserRoles?: number[]
}

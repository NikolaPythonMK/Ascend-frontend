export interface PermissionDTO {
    id: number,
    feature: string,
    canView: boolean,
    canAddAndEdit: boolean,
    canDelete: boolean
}
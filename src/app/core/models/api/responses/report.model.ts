export interface Report {
    id: number,
    name: string,
    description?: string | null,
    requestData: string,
    organizationID: number,
    locationID?: number | null,
    isActive: boolean,
    displayOrder?: number | null
}
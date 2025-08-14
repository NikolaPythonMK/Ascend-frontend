export interface ReportRequest {
    id: number,
    name: string,
    description?: string | null,
    requestData: string,
    displayOrder?: number | null
}
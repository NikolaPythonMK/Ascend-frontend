export interface UpdateCategoryRequest {
    id: number,
    name: string,
    description?: string,
    image?: string,
    categoryGroup?: number
}
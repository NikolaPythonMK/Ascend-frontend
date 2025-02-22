export interface CategoryGroupRequest {
    id?: number,
    name: string,
    description?: string,
    image?: ArrayBuffer | null,
    categories: number[]
}
import { Product } from "./product.model"

export interface Category {
    id: number,
    name: string,
    description: string,
    image: any | null,
    organizationID: number,
    categoryGroupId: number,
    products: Product[]
}
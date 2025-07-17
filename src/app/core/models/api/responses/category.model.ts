import { Product } from "./product.model"

export interface Category {
    id: number,
    name: string,
    description: string,
    image: any | null,
    organizationID: number,
    categoryGroupID: number,
    products: Product[]
}
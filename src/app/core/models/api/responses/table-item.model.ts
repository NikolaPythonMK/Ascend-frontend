import { Product } from "./product.model"

export interface TableItem {
    id: number,
    product: Product, 
    quantity: number,
    totalPrice: number
}
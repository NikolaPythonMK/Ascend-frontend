import { Product } from "./product.model"

export interface TableItem {
    id: number,
    tableID: number,
    product: Product
    locationID: number,
    quantity: number,
    totalPrice: number
}
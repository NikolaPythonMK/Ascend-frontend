import { Product } from "./product.model"

export interface TableItem {
    id: number,
    product: Product, 
    quantity: number,
    totalGrossPrice: number,
    productName: string,
    note?: string,
}
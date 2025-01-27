import { Product } from "./product-item.model";

export interface OrderItem {
    id: number;
    orderId: number;
    product: Product;
    quantity: number;
    price: number;
}
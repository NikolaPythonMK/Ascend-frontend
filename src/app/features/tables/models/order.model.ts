import { OrderItem } from "./order-item.model";

export interface Order {
    id: number;
    totalPrice: number;
    paymentMethod: string;
    dateTime: Date;
    staffId: number;
    table: string;
    note?: string;
    status: number;
    orderItems: OrderItem[];
}
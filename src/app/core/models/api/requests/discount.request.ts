import { DiscountType } from "../../enums/discount-type.enum";

export interface DiscountRequest {
    id?: number,
    name: string,
    code: string,
    value: number,
    type: DiscountType,
    isRecurring: boolean,
    expiryDate: string
}

export interface ApplyDiscountRequest {
    tableID: number,
    code: string
}
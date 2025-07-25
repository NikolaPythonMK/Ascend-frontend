import { DiscountType } from "../../enums/discount-type.enum";

export interface Discount {
    id: number,
    name: string,
    code: string,
    value: number,
    type: DiscountType,
    isRecurring: boolean,
    expiryDate: string
}
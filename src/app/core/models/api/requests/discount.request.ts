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
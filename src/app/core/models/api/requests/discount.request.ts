import { DiscountType } from "../../enums/discount-type.enum";

export interface DiscountRequest {
    id?: number,
    name: string,
    code: string,
    value: number,
    discountType: DiscountType,
    startDate?: string | null,
    endDate?: string | null,
    minPurchase?: number | null,
    isActive: boolean
}

export interface ApplyDiscountRequest {
    tableID: number,
    code: string
}

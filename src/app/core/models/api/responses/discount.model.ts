import { DiscountType } from "../../enums/discount-type.enum";

export interface Discount {
    id: number,
    name?: string,
    code: string,
    value: number,
    discountType: DiscountType | string,
    startDate?: string | null,
    endDate?: string | null,
    minPurchase?: number | null,
    isActive: boolean
}

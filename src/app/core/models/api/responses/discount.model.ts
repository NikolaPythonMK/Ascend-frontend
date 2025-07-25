import { DiscountType } from "../../enums/discount-type.enum";

export interface Discount {
    id: number,
    name?: string,
    code: string,
    value: number,
    discountType: DiscountType,
    startDate?: Date,
    endDate?: Date,
    startTime?: Date,
    endTime?: Date
}
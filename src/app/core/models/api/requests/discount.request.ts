import { DiscountType } from "../../enums/discount-type.enum";

export interface DiscountRequest {
    id?: number,
    name?: string,
    code: string,
    value: number,
    discountType: DiscountType,
    startDate?: Date,
    endDate?: Date,
    startTime?: Date,
    endTime?: Date
}

export interface ApplyDiscountRequest {
    tableID: number,
    code: string
}
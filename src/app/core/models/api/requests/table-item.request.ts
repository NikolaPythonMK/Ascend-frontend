export interface TableItemRequest {
    id?: number,
    quantity: number,
    productHistoryID: number,
    tableID: number,
    staffUserID: number,
    tableDiscountAmount: number,
    note?: string
}

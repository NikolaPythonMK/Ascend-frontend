export interface Product {
    id: number,
    code: string,
    name: string,
    price: number,
    description: string,
    image: string | null,
    categoryID: number,
    organizationID: number
}
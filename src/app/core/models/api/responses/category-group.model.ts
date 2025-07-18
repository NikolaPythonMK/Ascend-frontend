import { Category } from "./category.model";

export interface CategoryGroup {
    id: number,
    name: string,
    description: string,
    image?: any,
    categories: Category[]
}
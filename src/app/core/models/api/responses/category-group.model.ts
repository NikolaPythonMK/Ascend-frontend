import { Category } from "./category.model";

export interface CategoryGroup {
    id: number,
    name: string,
    descripton: string,
    image?: any,
    categories: Category[]
}
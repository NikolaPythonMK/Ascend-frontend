import { Category } from "./category.model";

export interface CategoryGroup {
    name: string,
    descripton: string,
    image?: string,
    categories: Category[]
}
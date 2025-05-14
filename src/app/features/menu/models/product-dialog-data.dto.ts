import { Category } from "../../../core/models/api/responses/category.model";

export interface ProductDialogData {
    id?: number,
    selectedCategory: Category
    categories: Category[]
}
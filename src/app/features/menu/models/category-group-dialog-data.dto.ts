import { CategoryGroup } from "../../../core/models/api/responses/category-group.model";
import { Category } from "../../../core/models/api/responses/category.model";

export interface CategoryGroupDialogData {
    categories: Category[],
    categoryGroupId: number
}
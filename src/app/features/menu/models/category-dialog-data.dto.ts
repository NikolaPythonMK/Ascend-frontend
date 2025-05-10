import { CategoryGroup } from "../../../core/models/api/responses/category-group.model";
import { Category } from "../../../core/models/api/responses/category.model";

export interface CategoryDialogData {
    categoryGroups: CategoryGroup[],
    selectedGroupId?: number,
    categoryId?: number
}
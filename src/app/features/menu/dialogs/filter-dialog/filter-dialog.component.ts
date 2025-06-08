import { Component, inject, signal } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { CategoriesService } from "../../../../core/services/api/categories.service";
import { CategoryGroupService } from "../../../../core/services/api/category-group.service";
import { CategoryGroupDialog } from "../category-group/category-group-dialog.component";
import { FilterDialogData } from "../../models/filter-dialog-data.dto";
import { CommonModule } from "@angular/common";
import { MatIcon } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";

@Component({
    imports: [CommonModule, MatIcon, MatButtonModule],
    templateUrl: 'filter-dialog.component.html',
    styleUrls: ['filter-dialog.component.scss']
})
export class FilterDialog {
        readonly dialogRef = inject(MatDialogRef<CategoryGroupDialog>);
        readonly data = inject<FilterDialogData>(MAT_DIALOG_DATA);
        readonly categoryGroupService = inject(CategoryGroupService);
        readonly categoryService = inject(CategoriesService);

        selectedItem = signal<number | undefined>(undefined);

        onSelect(selectedItem: number | null): void {
            //this.selectedItem.set(selectedItem);
            this.dialogRef.close(selectedItem);
        }

        onClose(): void {
            this.dialogRef.close(null);
        }
}
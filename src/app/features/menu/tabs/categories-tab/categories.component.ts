import { Component, inject } from "@angular/core";
import { ButtonComponent } from "../../../../core/ui/button/button.component";
import { Dialog } from "@angular/cdk/dialog";
import { AddCategoryDialog } from "../../dialogs/add-category-dialog/add-category.component";
import { MatDialog } from "@angular/material/dialog";

@Component({
    selector: 'categories-component',
    imports: [ButtonComponent],
    templateUrl: 'categories.component.html',
    styleUrls: ['categories.component.scss']
})
export class CategoriesComponent {
    private readonly dialog = inject(MatDialog);

    onAddCategory(): void {
        const dialogRef = this.dialog.open(AddCategoryDialog);
    }
}
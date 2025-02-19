import { Component, inject, signal } from "@angular/core";
import { ButtonComponent } from "../../../../core/ui/button/button.component";
import { Dialog } from "@angular/cdk/dialog";
import { AddCategoryDialog } from "../../dialogs/add-category-dialog/add-category.component";
import { MatDialog } from "@angular/material/dialog";
import { ListElement } from "../../../../core/ui/display-list/models/list-element.model";
import { DisplayListComponent } from "../../../../core/ui/display-list/display-list.component";
import { Card } from "../../../../core/ui/display-cards/models/card.model";
import { DisplayCardsComponent } from "../../../../core/ui/display-cards/display-cards.component";
import { SearchBarComponent } from "../../../../core/ui/search-bar/search-bar.component";
import { MatButtonModule, MatIconButton } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { HeaderCounterComponent } from "../../../../core/ui/header-counter/header-counter.component";
import { AddCategoryGroupDialog } from "../../dialogs/add-category-group-dialog/add-category-group.component";

@Component({
    selector: 'categories-component',
    imports: [ButtonComponent, DisplayListComponent, DisplayCardsComponent, SearchBarComponent, MatIconModule, MatButtonModule, HeaderCounterComponent],
    templateUrl: 'categories.component.html',
    styleUrls: ['categories.component.scss']
})
export class CategoriesComponent {
    private readonly dialog = inject(MatDialog);
    selectedCategory = signal<ListElement | null>(null)

    categoryGroups = signal<ListElement[]>([
        {id: 1, title: 'Drinks'},
        {id: 2, title: 'Breakfast'},
        {id: 3, title: 'Dinner'},
        {id: 4, title: 'Desserts'},
    ])

    categories = signal<Card[]>([
        {id: 1, title: 'Coctails'},
        {id: 2, title: 'Juices'},
        {id: 3, title: 'Wines'},
        {id: 4, title: 'Sendwiches'},
        {id: 5, title: 'Salads'},
        {id: 6, title: 'Toasts'},
        {id: 7, title: 'Soups'},
    ])

    onAddCategory(): void {
        const dialogRef = this.dialog.open(AddCategoryDialog);
    }
    onAddGroupCategory(): void {
        const dialogRef = this.dialog.open(AddCategoryGroupDialog);
    }

    onSelectedCategoryGroup(id: number | null) {
        const element = this.categoryGroups().find(i => i.id === id);
        this.selectedCategory.set(element ?? null);
    }
}
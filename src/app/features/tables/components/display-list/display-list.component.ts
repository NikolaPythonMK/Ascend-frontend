import { Component, input, output, signal } from "@angular/core";
import { Category } from "../../../../core/models/api/responses/category.model";
import { CommonModule } from "@angular/common";
import { SkeletonItemComponent } from "./skeleton-item/skeleton-item.component";
import { TranslateModule } from "@ngx-translate/core";

@Component({
    selector: 'display-list',
    imports: [CommonModule, SkeletonItemComponent, TranslateModule],
    templateUrl: 'display-list.component.html',
    styleUrls: ['display-list.component.scss', 'list-grid.scss']
})
export class DisplayListComponent {
    categories = input.required<Category[]>();
    selectedId = signal<number | null>(null);
    selectedCategoryEvent = output<number | null>();
    loading = input(false);

    onSelectCategory(id: number | null): void {
        this.selectedCategoryEvent.emit(id);
        this.selectedId.set(id);
    }
}   
import { Component, input, output, signal } from "@angular/core";
import { Category } from "../../../../core/models/api/responses/category.model";
import { CommonModule } from "@angular/common";

@Component({
    selector: 'display-list',
    imports: [CommonModule],
    templateUrl: 'display-list.component.html',
    styleUrls: ['display-list.component.scss']
})
export class DisplayListComponent {
    categories = input.required<Category[]>();
    selectedId = signal<number | null>(null);
    selectedCategoryEvent = output<number | null>();

    onSelectCategory(id: number | null): void {
        this.selectedCategoryEvent.emit(id);
        this.selectedId.set(id);
    }
}   
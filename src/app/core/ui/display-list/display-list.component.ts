import { Component, input, output, signal } from "@angular/core";
import { ListElement } from "./models/list-element.model";
import { CommonModule } from "@angular/common";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { trigger, state, style, transition, animate } from "@angular/animations";

@Component({
    selector: 'ascend-display-list',
    imports: [CommonModule, MatIconModule, MatButtonModule],
    templateUrl: 'display-list.component.html',
    styleUrls: ['display-list.component.scss'],
    animations: [
        // trigger('listAnimation', [
        //     state('expanded', style({ width: '300px', opacity: 1 })),
        //     state('collapsed', style({ width: '0px', opacity: 0.5, overflow: 'hidden' })),
        //     transition('expanded <=> collapsed', animate('300ms ease-in-out')),
        //   ])
    ]
})
export class DisplayListComponent {
    elements = input.required<ListElement[]>();
    noDataLabel = input<string>();

    selectedId = signal<number | null>(null);
    isCollapsed = signal<boolean>(false);

    selectedEvent= output<number | null>();
    addEvent = output<void>();
    deleteEvent = output<number>();

    colors: string[] = [
        "#FF6B6B", // Soft Red
        "#FFA07A", // Light Salmon
        "#FFD700", // Gold
        "#98FB98", // Pale Green
        "#20B2AA", // Light Sea Green
        "#87CEFA", // Light Sky Blue
        "#9370DB", // Medium Purple
        "#FF69B4", // Hot Pink
        "#F08080", // Light Coral
        "#FF4500", // Orange Red
        "#1E90FF", // Dodger Blue
        "#32CD32", // Lime Green
        "#4682B4", // Steel Blue
        "#FFB6C1", // Light Pink
        "#8A2BE2", // Blue Violet
    ];

    getBorderColor(index: number): string {
        return this.colors[index % this.colors.length];
    }
      

    onSelect(id: number | null): void {
        this.selectedId.set(id);
        this.selectedEvent.emit(id);
    }

    onDelete(id: number): void {
        this.deleteEvent.emit(id);
    }

    onCollapse(): void {
        this.isCollapsed.set(!this.isCollapsed());
    }

    onAdd(): void {
        this.addEvent.emit();
    }
}
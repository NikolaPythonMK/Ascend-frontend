import { CommonModule } from "@angular/common";
import { Component, EventEmitter, input, OnInit, Output, output } from "@angular/core";
import { MatCardModule } from "@angular/material/card";
import { Card } from "./models/card.model";
import { SkeletonCardComponent } from "./skeleton-card/skeleton-card.component";

@Component({
    selector: 'ascend-display-cards',
    imports: [CommonModule, MatCardModule, SkeletonCardComponent],
    templateUrl: 'display-cards.component.html',
    styleUrls: ['display-cards.component.scss', 'cards-grid.scss']
})
export class DisplayCardsComponent implements OnInit {
    elements = input.required<Card[]>();
    loading = input<boolean>(false);
    @Output() selectedCard = new EventEmitter<any>();
    
    ngOnInit(): void {
        console.log('cards: ', this.elements());
    }

    onSelect(card: any): void {
        this.selectedCard.emit(card);
    }
}
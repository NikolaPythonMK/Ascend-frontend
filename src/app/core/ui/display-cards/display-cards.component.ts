import { CommonModule } from "@angular/common";
import { Component, input, OnInit, output } from "@angular/core";
import { MatCardModule } from "@angular/material/card";
import { Card } from "./models/card.model";

@Component({
    selector: 'ascend-display-cards',
    imports: [CommonModule, MatCardModule],
    templateUrl: 'display-cards.component.html',
    styleUrls: ['display-cards.component.scss']
})
export class DisplayCardsComponent implements OnInit {
    elements = input.required<Card[]>();
    selectedCard = output<any>();

    ngOnInit(): void {
        console.log('cards: ', this.elements());
    }

    onSelect(card: any): void {
        this.selectedCard.emit(card);
    }
}
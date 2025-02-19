import { CommonModule } from "@angular/common";
import { Component, input } from "@angular/core";
import { MatCardModule } from "@angular/material/card";
import { Card } from "./models/card.model";

@Component({
    selector: 'ascend-display-cards',
    imports: [CommonModule, MatCardModule],
    templateUrl: 'display-cards.component.html',
    styleUrls: ['display-cards.component.scss']
})
export class DisplayCardsComponent {
    elements = input.required<Card[]>();
}
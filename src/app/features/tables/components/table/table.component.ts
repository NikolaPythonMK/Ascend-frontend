import { Component, signal } from "@angular/core";
import { DisplayListComponent } from "../display-list/display-list.component";
import { MatFormFieldModule, MatLabel } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { Card } from "../../../../core/ui/display-cards/models/card.model";
import { DisplayCardsComponent } from "../../../../core/ui/display-cards/display-cards.component";


@Component({
    selector: 'table',
    imports: [DisplayListComponent, MatFormFieldModule, MatLabel, MatIconModule, DisplayCardsComponent],
    templateUrl: 'table.component.html',
    styleUrls: ['table.component.scss']
})
export class TableComponent {
    cards = signal<Card[]>([
        {id: 1, title: 'Омлет', image: 'assets/images/temp/omelette.jpg'},
        {id: 2, title: 'Хамбургер', image: 'assets/images/temp/hamburger.jpg'},
        {id: 3, title: 'Туна сендвич', image: 'assets/images/temp/tuna-sandwich.jpg'},
        {id: 4, title: 'Чискејк', image: 'assets/images/temp/hamburger.jpg'}, // .....
        {id: 5, title: 'Чискејк', image: 'assets/images/temp/tuna-sandwich.jpg'},
        {id: 6, title: 'Палачинки', image: 'assets/images/temp/pancakes.jpg'},
        {id: 7, title: 'Омлет'},
        {id: 8, title: 'Омлет'},
        {id: 9, title: 'Омлет'},
        {id: 10, title: 'Омлет'},
        {id: 11, title: 'Омлет'},
        {id: 12, title: 'Омлет'},
        {id: 13, title: 'Омлет'},
        {id: 14, title: 'Омлет'},
    ])
}
import { CommonModule } from "@angular/common";
import { Component, EventEmitter, input, OnInit, Output, output } from "@angular/core";
import { MatCardModule } from "@angular/material/card";
import { Card } from "./models/card.model";
import { SkeletonCardComponent } from "./skeleton-card/skeleton-card.component";
import { environment } from "../../../../environments/environment";

@Component({
    selector: 'ascend-display-cards',
    imports: [CommonModule, MatCardModule, SkeletonCardComponent],
    templateUrl: 'display-cards.component.html',
    styleUrls: ['display-cards.component.scss', 'cards-grid.scss']
})
export class DisplayCardsComponent implements OnInit {
    elements = input.required<Card[]>();
    loading = input<boolean>(false);
    readonly imageFallback = 'assets/images/no-image-icon.png';
    private readonly filesBaseUrl = environment.domain.replace(/\/api\/?$/, '');
    @Output() selectedCard = new EventEmitter<number>();
    
    ngOnInit(): void {
        console.log('cards: ', this.elements());
    }

    onSelect(id: number): void {
        this.selectedCard.emit(id);
    }

    getImageSrc(image?: string | null): string {
        const trimmedImage = image?.trim();

        if (!trimmedImage) {
            return this.imageFallback;
        }

        if (
            trimmedImage.startsWith('http://')
            || trimmedImage.startsWith('https://')
            || trimmedImage.startsWith('assets/')
            || trimmedImage.startsWith('data:')
        ) {
            return trimmedImage;
        }

        return trimmedImage.startsWith('/')
            ? `${this.filesBaseUrl}${trimmedImage}`
            : `${this.filesBaseUrl}/${trimmedImage}`;
    }

    onImageError(event: Event): void {
        const image = event.target as HTMLImageElement | null;

        if (!image || image.src.endsWith(this.imageFallback)) {
            return;
        }

        image.src = this.imageFallback;
    }
}

import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, input, OnInit, signal } from '@angular/core';

@Component({
  selector: 'ascend-skeleton-card',
  imports: [CommonModule],
  templateUrl: './skeleton-card.component.html',
  styleUrls: ['./skeleton-card.component.scss', '../cards-grid.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SkeletonCardComponent implements OnInit{
    numberOfCards = input(1);
    length = signal<number>(this.numberOfCards());
    skeletonArary = signal<any[]>([]);

    ngOnInit(): void {
        this.skeletonArary.set(Array(this.numberOfCards()));     
    }
}

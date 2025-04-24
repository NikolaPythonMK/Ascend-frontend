import { ChangeDetectionStrategy, Component, input, OnInit, signal } from "@angular/core";

@Component({
    selector: 'ascend-skeleton-item',
    imports: [],
    templateUrl: 'skeleton-item.component.html',
    styleUrls: ['skeleton-item.component.scss', '../list-grid.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SkeletonItemComponent implements OnInit{
    count = input(1);
    length = signal<number>(this.count());
    skeletonArray = signal<any[]>([]);

    ngOnInit(): void {
        this.skeletonArray.set(Array(this.count()));
    }
}
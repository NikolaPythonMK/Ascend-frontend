import { Component, input} from "@angular/core";

@Component({
    selector: 'ascend-header-counter',
    imports: [],
    templateUrl: 'header-counter.component.html',
    styleUrls: ['header-counter.component.scss']
})
export class HeaderCounterComponent {
    value = input.required<number>();
}
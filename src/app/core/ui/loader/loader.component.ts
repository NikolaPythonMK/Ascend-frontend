import { Component } from "@angular/core";
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';

@Component({
    selector: 'ascend-loader',
    imports: [MatProgressSpinnerModule],
    templateUrl: 'loader.component.html',
    styleUrls: ['loader.component.scss']
})
export class LoaderComponent {

}
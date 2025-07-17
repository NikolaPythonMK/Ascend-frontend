import { Component, input, signal } from "@angular/core";
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { TranslateModule } from "@ngx-translate/core";

@Component({
    selector: 'ascend-loader',
    imports: [MatProgressSpinnerModule, TranslateModule],
    templateUrl: 'loader.component.html',
    styleUrls: ['loader.component.scss']
})
export class LoaderComponent {
    loading = input.required();
}
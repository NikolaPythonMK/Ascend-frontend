import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";

@Component({
    imports: [RouterLink, TranslateModule],
    templateUrl: 'not-found.component.html',
    styleUrls: ['not-found.component.scss']
})
export class NotFoundPageComponent {

}
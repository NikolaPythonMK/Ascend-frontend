import { Component, input, output } from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";

@Component({
    selector: 'ascend-search-bar',
    imports: [MatInputModule, MatIconModule, MatButtonModule, ReactiveFormsModule],
    templateUrl: 'search-bar.component.html',
    styleUrls: ['search-bar.component.scss']
})
export class SearchBarComponent {
    placeholder = input<string>('Пребарај')
    onSearchTerm = output<string>();
    searchTerm = new FormControl('');
}
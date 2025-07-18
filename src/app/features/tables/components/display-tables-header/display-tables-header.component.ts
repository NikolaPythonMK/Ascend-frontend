import { CommonModule } from "@angular/common";
import { Component, inject, input, output } from "@angular/core";
import { SearchBarComponent } from "../../../../core/ui/search-bar/search-bar.component";
import { MatIconModule } from "@angular/material/icon";
import { TranslateModule } from "@ngx-translate/core";
import { TableStateService } from "../../../../core/services/utility/table-state.service";


@Component({
    selector: 'tables-header',
    imports: [CommonModule, SearchBarComponent, MatIconModule, TranslateModule],
    templateUrl: 'display-tables-header.component.html',
    styleUrls: ['display-tables-header.component.scss']
})
export class DisplayTablesHeaderComponent {
    selectedView = input.required<string>();
    float = input(false);
    subscribe = input(false);
    onViewChange = output<string>();
    searchTerm = output<string>();
    readonly tableStateService = inject(TableStateService);

    handleViewChange(view: string): void {
        if (this.subscribe()) {
            this.tableStateService.view.next(view);
        }
        else {
            this.onViewChange.emit(view);
        }
    }

    onSearchTerm(searchTerm: string): void {
        this.searchTerm.emit(searchTerm);
    }
}
import { Component, computed, inject, OnDestroy, OnInit, signal } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { DisplayCardsComponent } from "../../../../core/ui/display-cards/display-cards.component";
import { HeaderCounterComponent } from "../../../../core/ui/header-counter/header-counter.component";
import { SearchBarComponent } from "../../../../core/ui/search-bar/search-bar.component";
import { MatDialog } from "@angular/material/dialog";
import { CategoryGroupService } from "../../../../core/services/api/category-group.service";
import { FilterDataService } from "../../../../core/services/utility/filter-data.service";
import { SnackbarService } from "../../../../core/services/utility/snackbar.service";
import { CategoryGroup } from "../../../../core/models/api/responses/category-group.model";
import { Card } from "../../../../core/ui/display-cards/models/card.model";
import { HttpErrorResponse } from "@angular/common/http";
import { Page } from "../../../../core/models/api/page.model";
import { CategoryGroupDialog } from "../../dialogs/category-group/category-group-dialog.component";
import { SearchTerm } from "../../../../core/models/api/search-term.model";
import { finalize } from "rxjs";
import { BreakpointService } from "../../../../core/services/utility/breakpoint.service";

@Component({
    selector: 'category-groups-component',
    imports: [DisplayCardsComponent, SearchBarComponent, MatIconModule, MatButtonModule, HeaderCounterComponent],
    templateUrl: 'category-groups.component.html',
    styleUrls: ['category-groups.component.scss']
})
export class CategoryGroupsComponent implements OnInit{
    private readonly dialog = inject(MatDialog);
    readonly categoryGroupService = inject(CategoryGroupService);
    readonly filterData = inject(FilterDataService);
    readonly snackbar = inject(SnackbarService);
    readonly breakpointService = inject(BreakpointService)
    searchTerm = signal<string>('');
    categoryGroups = signal<CategoryGroup[]>([]);
    categoryGroupLoading = signal<boolean>(false);
    
    categoryGroupCards = computed<Card[]>(() => this.categoryGroups().map(c => {
        return {
            id: c.id,
            title: c.name,
            image: c.image
        }
    }))

    ngOnInit(): void {
        this.getAllCategoryGroups(); 
    }

    onAddCategoryGroup(card: any): void {
        const dialogRef = this.dialog.open(CategoryGroupDialog)
        dialogRef.afterClosed().subscribe((result: any) => {
            if(!result){
                return;
            }
            this.getAllCategoryGroups();
        })
    }

    onUpdateCategoryGroup(id: number): void {
        const dialogRef = this.dialog.open(CategoryGroupDialog, {
            data: id
        })
        dialogRef.afterClosed().subscribe((result: any) => {
            if(!result){
                return;
            }
            this.getAllCategoryGroups();
        })
    }

    onSearchCategoryGroup(term: string): void {
        this.searchTerm.set(term);
        this.getAllCategoryGroups();
    }
 
    private getAllCategoryGroups(): void {
        this.categoryGroupLoading.set(true);
        const searchFilter: SearchTerm[] = this.filterData.createSearchTermFilter(this.searchTerm(), ['Name'])
        this.categoryGroupService.getAll(searchFilter).pipe(
         finalize(() => this.categoryGroupLoading.set(false))   
        )    
        .subscribe({
            next: (result: Page<CategoryGroup>) => {
                this.categoryGroups.set(result.data);
            },
            error: (error: HttpErrorResponse) => {
                this.snackbar.error(error.message);
            }
        })
    }
}
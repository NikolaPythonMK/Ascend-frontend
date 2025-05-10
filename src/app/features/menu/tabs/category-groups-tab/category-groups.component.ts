import { Component, computed, inject, OnDestroy, OnInit, signal } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { ButtonComponent } from "../../../../core/ui/button/button.component";
import { DisplayCardsComponent } from "../../../../core/ui/display-cards/display-cards.component";
import { HeaderCounterComponent } from "../../../../core/ui/header-counter/header-counter.component";
import { SearchBarComponent } from "../../../../core/ui/search-bar/search-bar.component";
import { DisplayListComponent } from "../../../tables/components/display-list/display-list.component";
import { MatDialog } from "@angular/material/dialog";
import { CategoryGroupService } from "../../../../core/services/api/category-group.service";
import { CategoriesService } from "../../../../core/services/api/categories.service";
import { FilterDataService } from "../../../../core/services/utility/filter-data.service";
import { SnackbarService } from "../../../../core/services/utility/snackbar.service";
import { CategoryGroup } from "../../../../core/models/api/responses/category-group.model";
import { Card } from "../../../../core/ui/display-cards/models/card.model";
import { HttpErrorResponse } from "@angular/common/http";
import { Page } from "../../../../core/models/api/page.model";

@Component({
    selector: 'category-groups-component',
    imports: [ButtonComponent, DisplayListComponent, DisplayCardsComponent, SearchBarComponent, MatIconModule, MatButtonModule, HeaderCounterComponent],
    templateUrl: 'category-groups.component.html',
    styleUrls: ['category-groups.component.scss']
})
export class CategoryGroupsComponent implements OnInit, OnDestroy{
    private readonly dialog = inject(MatDialog);
    readonly categoryGroupService = inject(CategoryGroupService);
    readonly categoryService = inject(CategoriesService);
    readonly filterData = inject(FilterDataService);
    readonly snackbar = inject(SnackbarService);
    searchTerm = signal<string>('');
    categoryGroups = signal<CategoryGroup[]>([]);
    
    categoryGroupCards = computed<Card[]>(() => this.categoryGroups().map(c => {
        return {
            id: c.id,
            title: c.name,
            image: c.image
        }
    }))

    ngOnDestroy(): void {
    }

    ngOnInit(): void {
        this.getAllCategoryGroups();                
    }


    onAddCategoryGroup(): void {

    }

    onUpdateCategoryGroup(obj: any): void {

    }

    onDeleteCategoryGroup(): void {

    }

    onSearchCategoryGroup(term: string): void {
        
    }
 
    
    private getAllCategoryGroups(): void {
        console.log("IM CALLING IT");
        this.categoryGroupService.getAll().subscribe({
            next: (result: Page<CategoryGroup>) => {
                this.categoryGroups.set(result.data);
                console.log("GROUPS: ", this.categoryGroups());
            },
            error: (error: HttpErrorResponse) => {
                this.snackbar.error(error.message);
            }
        })
    }
}
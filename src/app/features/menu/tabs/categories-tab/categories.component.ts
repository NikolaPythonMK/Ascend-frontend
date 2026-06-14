import { Component, computed, inject, OnDestroy, OnInit, signal } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { ListElement } from "../../../../core/ui/display-list/models/list-element.model";
import { DisplayListComponent } from "../../../../core/ui/display-list/display-list.component";
import { Card } from "../../../../core/ui/display-cards/models/card.model";
import { DisplayCardsComponent } from "../../../../core/ui/display-cards/display-cards.component";
import { SearchBarComponent } from "../../../../core/ui/search-bar/search-bar.component";
import { MatButtonModule, MatIconButton } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { HeaderCounterComponent } from "../../../../core/ui/header-counter/header-counter.component";
import { CategoriesService } from "../../../../core/services/api/categories.service";
import { FilterDataService } from "../../../../core/services/utility/filter-data.service";
import { SearchTerm } from "../../../../core/models/api/search-term.model";
import { HttpErrorResponse } from "@angular/common/http";
import { Category } from "../../../../core/models/api/responses/category.model";
import { Page } from "../../../../core/models/api/page.model";
import { CategoryGroupService } from "../../../../core/services/api/category-group.service";
import { SnackbarService } from "../../../../core/services/utility/snackbar.service";
import type { CategoryGroup } from "../../../../core/models/api/responses/category-group.model";
import type { CategoryDialogData } from "../../models/category-dialog-data.dto";
import { CategoryDialog } from "../../dialogs/category/category-dialog.component";
import { ImageService } from "../../../../core/services/utility/image.service";
import { finalize } from "rxjs";
import { CommonModule } from "@angular/common";
import { BreakpointService } from "../../../../core/services/utility/breakpoint.service";
import { Filter } from "../../../../core/models/api/value-objects/filter.model";
import { TranslateModule } from "@ngx-translate/core";
import { PermissionService } from "../../../../core/services/auth/permission.service";
import { LoaderComponent } from "../../../../core/ui/loader/loader.component";

@Component({
    selector: 'categories-component',
    imports: [DisplayListComponent, DisplayCardsComponent, SearchBarComponent, MatIconModule, MatButtonModule, HeaderCounterComponent, CommonModule, TranslateModule, LoaderComponent],
    templateUrl: 'categories.component.html',
    styleUrls: ['categories.component.scss', '../../styles/tab-style.scss']
})
export class CategoriesComponent implements OnInit{
    private readonly dialog = inject(MatDialog);
    readonly categoryService = inject(CategoriesService);
    readonly categoryGroupService = inject(CategoryGroupService);
    readonly filterData = inject(FilterDataService);
    readonly snackbar = inject(SnackbarService);
    readonly imageService = inject(ImageService);
    readonly breakpointService = inject(BreakpointService)
    private authz = inject(PermissionService);
    selectedCategoryGroup = signal<number | null>(null)
    searchTerm = signal<string>('');
    categories = signal<Category[]>([]);
    categoryGroups = signal<CategoryGroup[]>([]);
    categoryLoading = signal<boolean>(false);
    categoryGroupsLoading = signal<boolean>(false);

    canCreate = computed(() =>
        this.authz.has({ name: '/api/category/create', method: 'POST' })
    );

    canUpdate = computed(() =>
        this.authz.has({ name: '/api/category/update', method: 'PUT' })
    );

    canDelete = computed(() =>
        this.authz.has({ name: '/api/category/delete', method: 'POST' })
    );

    categoryCards = computed<Card[]>(() => this.categories().map(c => {
        return {
            id: c.id,
            title: c.name,
            image: c.image
        }
    }))

    categoryGroupElements = computed<ListElement[]>(() => this.categoryGroups().map(c => {
        return {
            id: c.id,
            title: c.name
        }
    }))

    ngOnInit(): void {
        this.getAllCategories();
        if(this.breakpointService.isDesktop()){
            this.getAllCategoryGroups();
        }      
    }

    onAddCategory(): void {
        const dialogRef = this.dialog.open(CategoryDialog, {
            data: {
                selectedGroupId: this.selectedCategoryGroup()
            } as CategoryDialogData
        });
        dialogRef.afterClosed().subscribe((result: Category) => {
            if(!result) {
                return;
            }

            if (this.selectedCategoryGroup()) {
                this.getCategoriesByGroupId(this.selectedCategoryGroup());
            } else {
                this.getAllCategories();
            }
        })
    }

    onUpdateCategory(id: number): void {
        const dialogRef = this.dialog.open(CategoryDialog, {
            data: {
                id: id
            } as CategoryDialogData
        })
        dialogRef.afterClosed().subscribe((result) => {
            if (!result) {
                return;
            }

            if (this.selectedCategoryGroup()) {
                this.getCategoriesByGroupId(this.selectedCategoryGroup());
            } else {
                this.getAllCategories();
            }
        })
    }

    onSelectedCategoryGroup(id: number | null) {
        if(!id){
            this.getAllCategories();
            this.selectedCategoryGroup.set(null);
            return;
        }
        this.getCategoriesByGroupId(id);
    }

    onSearchCategory(term: string){
        this.searchTerm.set(term);
        this.getAllCategories();
    }

    private getCategoriesByGroupId(id: number | null): void {
        if(id == null){
            return;
        }

        this.categoryLoading.set(true);
        const filter: Filter = {
            propName: "CategoryGroupID",
            operator: "=",
            value: id.toString()
        };
            
        this.categoryService.getAll([], undefined, [filter])
        .pipe(
            finalize(() => this.categoryLoading.set(false))
        )
        .subscribe({
            next: (result: Page<Category>) => {
                this.categories.set(result.data.map(c => {
                    return {
                        id: c.id,
                        name: c.name,
                        image: c.image,
                        description: c.description
                    } as Category;
                }));
            },
            error: (error: HttpErrorResponse) => {
                this.snackbar.error(error.message);
                this.selectedCategoryGroup.set(null);
            }
        })
    }

    private getAllCategories(): void {
        this.categoryLoading.set(true)
        const searchFilter: SearchTerm[] = this.filterData.createSearchTermFilter(this.searchTerm(), ['Name'])
        this.categoryService.getAll(searchFilter)
        .pipe(
            finalize(() => this.categoryLoading.set(false))
        )
        .subscribe({
            next: (result: Page<Category>) => {
                this.categories.set(result.data.map(c => {
                    return {
                        id: c.id,
                        name: c.name,
                        image: c.image,
                        description: c.description
                    } as Category;  
                }));
            },
            error: (error: HttpErrorResponse) => {
                this.snackbar.error(error.message);
            }
        })
    }

    private getAllCategoryGroups(): void {
        this.categoryGroupsLoading.set(true);
        this.categoryGroupService.getAll()
        .pipe(
            finalize(() => this.categoryGroupsLoading.set(false))
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

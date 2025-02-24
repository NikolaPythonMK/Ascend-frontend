import { Component, computed, inject, OnDestroy, OnInit, signal } from "@angular/core";
import { ButtonComponent } from "../../../../core/ui/button/button.component";
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
import type { CategoryGroupDialogData } from "../../models/category-group-dialog-data.dto";
import { CategoryGroupDialog } from "../../dialogs/category-group/category-group-dialog.component";
import { CategoryDialog } from "../../dialogs/category/category-dialog.component";
import loadesh from 'lodash';
import { ImageService } from "../../../../core/services/utility/image.service";
import { ConfirmationDialog } from "../../../../core/ui/confirmation-dialog/confirmation-dialog.component";

@Component({
    selector: 'categories-component',
    imports: [ButtonComponent, DisplayListComponent, DisplayCardsComponent, SearchBarComponent, MatIconModule, MatButtonModule, HeaderCounterComponent],
    templateUrl: 'categories.component.html',
    styleUrls: ['categories.component.scss']
})
export class CategoriesComponent implements OnInit, OnDestroy{
    private readonly dialog = inject(MatDialog);
    readonly categoryService = inject(CategoriesService);
    readonly categoryGroupService = inject(CategoryGroupService);
    readonly filterData = inject(FilterDataService);
    readonly snackbar = inject(SnackbarService);
    readonly imageService = inject(ImageService);
    selectedCategoryGroup = signal<CategoryGroup | null>(null)
    searchTerm = signal<string>('');
    categories = signal<Category[]>([]);
    categoryGroups = signal<CategoryGroup[]>([]);

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
        this.getAllCategoryGroups();
        this.getAllCategories();
    }

    ngOnDestroy(): void {
        this.categories().forEach(c => URL.revokeObjectURL(c.image));
    }

    onAddCategory(): void {
        const dialogRef = this.dialog.open(CategoryDialog, {
            data: {
                categoryGroups: this.categoryGroups(),
                selectedGroupId: this.selectedCategoryGroup()?.id
            } as CategoryDialogData
        });
        dialogRef.afterClosed().subscribe((result: Category) => {
            if(!result) {
                return;
            }

  
            if (this.selectedCategoryGroup()) {
                this.getCategoriesByGroupId(this.selectedCategoryGroup()!.id);
            } else {
                this.getAllCategories();
            }
            
            // if (!this.selectedCategoryGroup() || (result.categoryGroupId === this.selectedCategoryGroup()?.id)){
            //     this.categories.set([result, ...this.categories()])
            // }
        })
    }
    onAddGroupCategory(): void {
        const dialogRef = this.dialog.open(CategoryGroupDialog, {
            data: {
                categories: this.categories(),
            } as CategoryGroupDialogData
        });
        dialogRef.afterClosed().subscribe((result) => {
            if(!result) {
                return;
            }
            this.getAllCategoryGroups();
        })
    }

    onUpdateCategory(id: number): void {
        const category = this.categories().find(c => c.id === id);
        const dialogRef = this.dialog.open(CategoryDialog, {
            data: {
                categoryGroups: this.categoryGroups(),
                category,
                
            } as CategoryDialogData
        })
    }

    onDeleteCategoryGroup(id: number): void {
        const dialogRef = this.dialog.open(ConfirmationDialog);
        dialogRef.afterClosed().subscribe((result: boolean) => {
            if(result) {
                this.categoryGroupService.delete(id).subscribe({
                    next: () => {
                        this.categoryGroups.set(this.categoryGroups().filter(c => c.id !== id));
                        this.getAllCategories();
                        this.selectedCategoryGroup.set(null);
                        this.snackbar.success('Успешно е избришана групата на категории');
                    },
                    error: (error: HttpErrorResponse) => {
                        this.snackbar.error(error.message);
                    }
                });
            }
        })
    }

    onUpdateCategoryGroup(): void {

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
    }

    private getCategoriesByGroupId(id: number): void {
        this.categoryGroupService.getById(id).subscribe({
            next: (result: CategoryGroup) => {
                this.categories.set(result.categories.map(c => {
                    return {
                        id: c.id,
                        name: c.name,
                        image: this.imageService.getImageUrl(c.image),
                        description: c.description
                    } as Category;
                }));
                this.selectedCategoryGroup.set(result);
            },
            error: (error: HttpErrorResponse) => {
                this.snackbar.error(error.message);
                this.selectedCategoryGroup.set(null);
            }
        })
    }

    private getAllCategories(): void {
        const searchFilter: SearchTerm[] = this.filterData.createSearchTermFilter(this.searchTerm(), ['name'])
        this.categoryService.getAll().subscribe({
            next: (result: Page<Category>) => {
                this.categories.set(result.data.map(c => {
                    return {
                        id: c.id,
                        name: c.name,
                        image: this.imageService.getImageUrl(c.image),
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
        this.categoryGroupService.getAll().subscribe({
            next: (result: Page<CategoryGroup>) => {
                this.categoryGroups.set(result.data);
            },
            error: (error: HttpErrorResponse) => {
                this.snackbar.error(error.message);
            }
        })
    }
}
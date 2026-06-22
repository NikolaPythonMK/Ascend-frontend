import { Component, computed, inject, OnInit, signal } from "@angular/core";
import { MatTabsModule } from "@angular/material/tabs";
import { TableStateService } from "../../../core/services/utility/table-state.service";
import { TableComponent } from "../../../core/ui/table/table.component";
import { MatDialog } from "@angular/material/dialog";
import { finalize } from "rxjs";
import { Page } from "../../../core/models/api/page.model";
import { SnackbarService } from "../../../core/services/utility/snackbar.service";
import { HttpErrorResponse } from "@angular/common/http";
import { LoaderComponent } from "../../../core/ui/loader/loader.component";
import { DataRow } from "../../../core/ui/table/models/data-row";
import { TranslateModule } from "@ngx-translate/core";
import { DiscountService } from "../../../core/services/api/discount.service";
import { Discount } from "../../../core/models/api/responses/discount.model";
import { DiscountDialog } from "../dialogs/discount-dialog/discount-dialog.component";
import { PermissionService } from "../../../core/services/auth/permission.service";
import { Sort } from "../../../core/ui/table/models/sort.model";
import TranslationService from "../../../core/services/utility/translation.service";


@Component({
    selector: 'settings-discounts',
    imports: [MatTabsModule, TableComponent, LoaderComponent, TranslateModule],
    providers: [TableStateService],
    templateUrl: 'settings-discounts.component.html',
    styleUrls: ['settings-discounts.component.scss', '../style.scss']
})
export class SettingsDiscountsComponent implements OnInit {
    private readonly discountService = inject(DiscountService);
    private readonly tableState = inject(TableStateService);
    private readonly snackbar = inject(SnackbarService);
    private readonly dialog = inject(MatDialog);
    private readonly authz = inject(PermissionService);
    private readonly translationService = inject(TranslationService);

    canCreate = computed(() => this.authz.has({ name: '/api/discount/create', method: 'POST' }));
    discounts = signal<Discount[]>([]);
    discountRows = computed<DataRow[]>(() => this.mapToRows(this.discounts()))
    searchTerm = this.tableState.searchTerm;
    sort = this.tableState.sort;
    map = new Map<string, string>([
        ['settings.discounts.code', 'code'],
        ['settings.discounts.name', 'name'],
        ['settings.discounts.discountType', 'discountType'],
        ['settings.discounts.value', 'value'],
        ['settings.discounts.startDate', 'startDate'],
        ['settings.discounts.endDate', 'endDate'],
        ['settings.discounts.isActive', 'isActive']
    ]);
    colDisplayNames = computed(() => [...this.map.keys()]);
    nonSortableColumns = signal<string[]>([])
    nonSearchableColumns = signal<string[]>([
        'settings.discounts.discountType',
        'settings.discounts.value',
        'settings.discounts.startDate',
        'settings.discounts.endDate',
        'settings.discounts.isActive'
    ])
    loading = signal<boolean>(false);

    ngOnInit(): void {
        this.getDiscounts();
    }

    onAdd(): void {
        const dialogRef = this.dialog.open(DiscountDialog);
        dialogRef.afterClosed().subscribe((result) => {
            if(result) {
                this.getDiscounts();
            }
        })
    }

    onUpdate(id: number): void {
        const dialogRef = this.dialog.open(DiscountDialog, {data: id});
        dialogRef.afterClosed().subscribe((result) => {
            if(result) {
                this.getDiscounts();
            }
        })
    }

    onSearch(term: string): void {
        this.tableState.setSearch(
            term,
            this.colDisplayNames(),
            this.nonSearchableColumns(),
            this.map
        );
        this.getDiscounts();
    }

    onSort(sort: Sort | null): void {
        this.tableState.setSort(sort, this.map);
        this.getDiscounts();
    }

    private mapToRows(discounts: Discount[]): DataRow[] {
        return discounts.map(i => {
            return {
                id: i.id,
                properties: {
                    name: i.name,
                    code: i.code,
                    discountType: this.formatDiscountType(i.discountType),
                    value: i.value,
                    startDate: this.formatDate(i.startDate),
                    endDate: this.formatDate(i.endDate),
                    isActive: i.isActive
                        ? this.translationService.getTranslationForKey('shared.yes')
                        : this.translationService.getTranslationForKey('shared.no')
                }
            }
        })
    }

    private formatDiscountType(type: Discount['discountType']): string {
        const normalized = String(type).toLowerCase();
        return normalized === '1' || normalized === 'percentage'
            ? this.translationService.getTranslationForKey('settings.discounts.percent')
            : this.translationService.getTranslationForKey('settings.discounts.amount');
    }

    private formatDate(value?: string | null): string {
        if (!value) return '';
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
    }

    private getDiscounts(): void {
        this.loading.set(true);

        this.discountService.getAll(this.searchTerm(), this.sort()).pipe(
            finalize(() => this.loading.set(false))
        ).subscribe({
            next: (discounts: Page<Discount>) => {
                this.discounts.set(discounts.data);
            },
            error: (error: HttpErrorResponse) => {
                this.snackbar.error(error.message);
            }
        })        
    }    
}

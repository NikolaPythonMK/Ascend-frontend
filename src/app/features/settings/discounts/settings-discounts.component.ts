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
        ['settings.discounts.startTime', 'startTime'],
        ['settings.discounts.endTime', 'endTime']
    ]);
    colDisplayNames = computed(() => [...this.map.keys()]);
    nonSortableColumns = signal<string[]>([])
    nonSearchableColumns = signal<string[]>([
        'settings.discounts.discountType',
        'settings.discounts.value',
        'settings.discounts.startDate',
        'settings.discounts.endDate',
        'settings.discounts.startTime',
        'settings.discounts.endTime'
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
        return discounts.map((i, index) => {
            return {
                id: i.id,
                properties: {
                    name: i.name,
                    code: i.code,
                    discountType: i.discountType,
                    value: i.value,
                    startDate: i.startDate,
                    endDate: i.endDate,
                    startTime: i.startTime,
                    endTime: i.endTime
                
                }
            }
        })
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

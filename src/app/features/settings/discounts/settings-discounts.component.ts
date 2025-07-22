import { Component, computed, inject, OnInit, signal } from "@angular/core";
import { MatTabsModule } from "@angular/material/tabs";
import { TableStateService } from "../../../core/services/utility/table-state.service";
import { TableComponent } from "../../../core/ui/table/table.component";
import { MatDialog } from "@angular/material/dialog";
import { Data, Router } from "@angular/router";
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


@Component({
    selector: 'settings-discounts',
    imports: [MatTabsModule, TableComponent, LoaderComponent, TranslateModule],
    templateUrl: 'settings-discounts.component.html',
    styleUrls: ['settings-discounts.component.scss', '../style.scss']
})
export class SettingsDiscountsComponent {
    private readonly discountService = inject(DiscountService);
    private readonly tableState = inject(TableStateService);
    private readonly snackbar = inject(SnackbarService);
    private readonly dialog = inject(MatDialog);
    private readonly router = inject(Router);
    discounts = signal<Discount[]>([]);
    discountRows = computed<DataRow[]>(() => this.mapToRows(this.discounts()))
    searchTerm = this.tableState.searchTerm;
    sort = this.tableState.sort;
    map = new Map<string, string>([
        ['Name', 'name'],
        ['Code', 'code'],
        ['Value', 'value'],
        ['Recurring', 'isReccuring'],
        ['Expiry Date', 'expiryDate']
    ]);
    colDisplayNames = computed(() => [...this.map.keys()]);
    nonSortableColumns = signal<string[]>([])
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

    private mapToRows(discounts: Discount[]): DataRow[] {
        return discounts.map((i, index) => {
            return {
                id: i.id,
                properties: {
                    name: i.name,
                    code: i.code,
                    type: i.type,
                    value: i.value,
                    isRecurring: i.isRecurring ? 'Yes' : 'No'
                }
            }
        })
    }

    private getDiscounts(): void {
        this.loading.set(true);

        this.discountService.getAll().pipe(
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
import { Component, computed, inject, OnInit, signal } from "@angular/core";
import { Tax } from "../../../core/models/api/responses/tax.model";
import { MatTabsModule } from "@angular/material/tabs";
import { TableStateService } from "../../../core/services/utility/table-state.service";
import { TableComponent } from "../../../core/ui/table/table.component";
import { MatDialog } from "@angular/material/dialog";
import { TaxDialog } from "../dialogs/tax-dialog/tax-dialog.component";
import { Data, Router } from "@angular/router";
import { TaxService } from "../../../core/services/api/tax.service";
import { finalize } from "rxjs";
import { Page } from "../../../core/models/api/page.model";
import { SnackbarService } from "../../../core/services/utility/snackbar.service";
import { HttpErrorResponse } from "@angular/common/http";
import { LoaderComponent } from "../../../core/ui/loader/loader.component";
import { DataRow } from "../../../core/ui/table/models/data-row";
import { TranslateModule } from "@ngx-translate/core";
import { PermissionService } from "../../../core/services/auth/permission.service";

@Component({
    selector: 'settings-taxes',
    imports: [MatTabsModule, TableComponent, LoaderComponent, TranslateModule],
    templateUrl: 'settings-taxes.component.html',
    styleUrls: ['settings-taxes.component.scss']
})
export class SettingsTaxesComponent implements OnInit {
    private readonly taxService = inject(TaxService);
    private readonly tableState = inject(TableStateService);
    private readonly snackbar = inject(SnackbarService);
    private readonly dialog = inject(MatDialog);
    private readonly router = inject(Router);
    private readonly authz = inject(PermissionService);

    canCreate = computed(() => this.authz.has({ name: '/api/tax/create', method: 'POST' }));
    taxes = signal<Tax[]>([]);
    taxRows = computed<DataRow[]>(() => this.mapToRows(this.taxes()))
    searchTerm = this.tableState.searchTerm;
    sort = this.tableState.sort;
    map = new Map<string, string>([
        ['Name', 'name'],
        ['Percentage', 'percentage'],
    ]);
    colDisplayNames = computed(() => [...this.map.keys()]);
    nonSortableColumns = signal<string[]>([])
    loading = signal<boolean>(false);

    ngOnInit(): void {
        this.getTaxes();
    }

    onAdd(): void {
        const dialogRef = this.dialog.open(TaxDialog);
        dialogRef.afterClosed().subscribe((result) => {
            if(result) {
                this.getTaxes();
            }
        })
    }

    onUpdate(id: number): void {
        this.router.navigate(['tax-details', id])
    }


    private mapToRows(taxes: Tax[]): DataRow[] {
        return taxes.map((i, index) => {
            return {
                id: i.id,
                properties: {
                    name: i.name,
                    percentage: i.percentage + ' %'
                }
            }
        })
    }

    private getTaxes(): void {
        this.loading.set(true);

        this.taxService.getAll().pipe(
            finalize(() => this.loading.set(false))
        ).subscribe({
            next: (taxes: Page<Tax>) => {
                this.taxes.set(taxes.data);
            },
            error: (error: HttpErrorResponse) => {
                this.snackbar.error(error.message);
            }
        })        
    }
}
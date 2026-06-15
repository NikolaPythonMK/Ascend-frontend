import { Component, computed, inject, OnInit, signal } from "@angular/core";
import { LocationService } from "../../core/services/api/locations.service";
import { HttpErrorResponse } from "@angular/common/http";
import { SnackbarService } from "../../core/services/utility/snackbar.service";
import { Page } from "../../core/models/api/page.model";
import { TableComponent } from "../../core/ui/table/table.component";
import { MatDialog } from "@angular/material/dialog";
import { CreateLocatinDialog } from "./components/create-locations-dialog/create-location.component";
import { UpdateLocationDialog } from "./components/update-location-dialog/update-location.component";
import { TableStateService } from "../../core/services/utility/table-state.service";
import { Sort } from "../../core/ui/table/models/sort.model";
import { Location } from "../../core/models/api/responses/location.model";
import { DataRow } from "../../core/ui/table/models/data-row";
import { TranslateModule } from "@ngx-translate/core";
import { PermissionService } from "../../core/services/auth/permission.service";

@Component({
    imports: [TableComponent, TranslateModule],
    providers: [TableStateService],
    templateUrl: 'locations.component.html',
    styleUrls: ['locations.component.scss', '../../core/styles/menu-item-page.scss']
})
export class LocationsPage implements OnInit{
    private readonly locationsService = inject(LocationService);
    private readonly snackbarService = inject(SnackbarService);
    private readonly dialog = inject(MatDialog);
    private readonly tableState = inject(TableStateService);
    locations = signal<Location[]>([]);
    private authz = inject(PermissionService);
    
    canCreate = computed(() =>
            this.authz.has({ name: '/api/location/create', method: 'POST' })
    );

    locationRows = computed(() => this.mapToRows(this.locations()))
    searchTerm = this.tableState.searchTerm;
    sort = this.tableState.sort;
    map = new Map<string, string>([
        ['Name', 'name'],
        ['Tables', 'tableCount'],
    ]);
    colDisplayNames = computed(() => [...this.map.keys()]);
    nonSortableColumns = signal<string[]>([])
    nonSearchableColumns = signal<string[]>(['Tables'])
    

    ngOnInit(): void {
        this.getLocations();
    }

    onAdd(): void {
        const dialogRef = this.dialog.open(CreateLocatinDialog);
        dialogRef.afterClosed().subscribe((result: Location) => {
            if (result) {
                this.getLocations();
            }
        })
    }

    onUpdate(id: number): void {
        const dialogRef = this.dialog.open(UpdateLocationDialog, {
            data: id
        });
        dialogRef.afterClosed().subscribe((result: Location | number) => {
            if(result) {
                this.getLocations();
            }
        })
    }

    onSort(sort: Sort | null) {
        this.tableState.setSort(sort, this.map);
        this.getLocations();
    }
      

    onSearch(term: string) {
        this.tableState.setSearch(term, this.colDisplayNames(), this.nonSearchableColumns(), this.map);
        this.getLocations();
    }

    private mapToRows(locations: Location[]): DataRow[] {
        return locations.map(i => {
            return {
                id: i.id,
                properties: {
                    name: i.name,
                    tableCount: i.tableCount
                }
            } as DataRow
        })
    }

    private getLocations(): void{
        this.locationsService.getAll(this.searchTerm(), this.sort()).subscribe({
            next: (result: Page<Location>) => {
                this.locations.set(result.data);
            },
            error: (error: HttpErrorResponse) => {
                this.snackbarService.error(error.message);
            }
        })
    }
}

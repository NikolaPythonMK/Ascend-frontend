import { Component, computed, inject, OnInit, signal } from "@angular/core";
import { LocationService } from "../../core/services/api/locations.service";
import { HttpErrorResponse } from "@angular/common/http";
import { SnackbarService } from "../../core/services/utility/snackbar.service";
import { Page } from "../../core/models/api/page.model";
import { TableComponent } from "../../core/ui/table/table.component";
import type { LocationRow } from "./models/location-row.model";
import { MatDialog } from "@angular/material/dialog";
import { CreateLocatinDialog } from "./components/create-locations-dialog/create-location.component";
import { UpdateLocationDialog } from "./components/update-location-dialog/update-location.component";
import { TableStateService } from "../../core/services/utility/table-state.service";
import { Sort } from "../../core/ui/table/models/sort.model";
import { Location } from "../../core/models/api/responses/location.model";

@Component({
    imports: [TableComponent],
    providers: [TableStateService],
    templateUrl: 'locations.component.html',
    styleUrls: ['locations.component.scss']
})
export class LocationsPage implements OnInit{
    private readonly locationsService = inject(LocationService);
    private readonly snackbarService = inject(SnackbarService);
    private readonly dialog = inject(MatDialog);
    private readonly tableState = inject(TableStateService);
    locations = signal<Location[]>([]);

    locationRows = computed(() => this.mapToRows(this.locations()))
    searchTerm = this.tableState.searchTerm;
    sort = this.tableState.sort;
    map = new Map<string, string>([
        ['Name', 'name'],
        ['Tables', 'tableCount'],
    ]);
    colDisplayNames = computed(() => [...this.map.keys()]);
    nonSortableColumns = signal<string[]>([])
    

    ngOnInit(): void {
        this.getLocations();
    }

    onAdd(): void {
        const dialogRef = this.dialog.open(CreateLocatinDialog);
        dialogRef.afterClosed().subscribe((result: Location) => {
            if (result) {
                this.getLocations();
                //this.locations.update(values => [result, ...values]);
            }
        })
    }

    onUpdate(index: number): void {
        const dialogRef = this.dialog.open(UpdateLocationDialog, {
            data: this.locations()[index]
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
        this.tableState.setSearch(term, this.colDisplayNames(), this.nonSortableColumns(), this.map);
        this.getLocations();
    }

    private mapToRows(locations: Location[]): LocationRow[] {
        return locations.map(i => {
            return {
                name: i.name,
                tableCount: i.tableCount
            }
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
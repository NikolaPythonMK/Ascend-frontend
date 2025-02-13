import { Component, inject, OnInit, signal } from "@angular/core";
import { LocationServvice } from "../../core/services/api/locations.service";
import { HttpErrorResponse } from "@angular/common/http";
import { SnackbarService } from "../../core/services/utility/snackbar.service";
import { Page } from "../../core/models/api/page.model";
import { Location } from "../../core/models/api/location.model";
import { TableComponent } from "../../core/ui/table/table.component";
import type { LocationRow } from "./models/location-row.model";
import { MatDialog } from "@angular/material/dialog";
import { LocationsDialog } from "./components/locations-dialog/locations.component";

@Component({
    imports: [TableComponent],
    templateUrl: 'locations.component.html',
    styleUrls: ['locations.component.scss']
})
export class LocationsPage implements OnInit{
    private readonly locationsService = inject(LocationServvice);
    private readonly snackbarService = inject(SnackbarService);
    private readonly dialog = inject(MatDialog);
    locations = signal<Location[]>([]);
    locationRows: LocationRow[] = []

    ngOnInit(): void {
        this.locationsService.getAllLocations().subscribe({
            next: (result: Page<Location>) => {
                this.locations.set(result.data);
                this.locationRows = this.mapToRows(result.data);
            },
            error: (error: HttpErrorResponse) => {
                this.snackbarService.error(error.message);
            }
        })
    }

    onAdd(): void {
        this.dialog.open(LocationsDialog);
    }

    private mapToRows(locations: Location[]): LocationRow[] {
        return locations.map(i => {
            return {
                name: i.name,
                tableCount: i.tableCount
            }
        })
    }
}
import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../../../../environments/environment";
import { BaseService } from "./base.service";
import type { LocationRequest } from "../../models/api/requests/location.request";
import type { Location } from "../../models/api/responses/location.model";
import { LocationTablesRequest } from "../../models/api/requests/location-tables.request";
import { LocationTableMappings } from "../../models/api/responses/table-mapping.model";

@Injectable({
    providedIn: 'root'
})
export class LocationService extends BaseService<Location, LocationRequest> {
    protected override http = inject(HttpClient);
    protected override domain = environment.domain;

    constructor() {
        super('location');
    }

    /**
     *  Returns the locations for the dropdown at /login
     *  BaseService has the actual GetAll() method for populating the tables at /locations
     */
    getLocations(email: string): Observable<Location[]> {
        return this.http.get<Location[]>(`${this.domain}/auth/locations?email=${email}`);
    }

    getTableMapping(locationId: number): Observable<string> {
        console.log("Getting table mapping for location ID:", locationId);
        return this.http.post<string>(`${this.domain}/location/get-table-mapping`, { id: locationId }, { withCredentials: true });
    }

    updateTableMapping(request: LocationTablesRequest): Observable<void> {
        return this.http.post<void>(`${this.domain}/location/update-table-mapping`, request, { withCredentials: true});
    }
}
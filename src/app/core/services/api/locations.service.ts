import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../../../../environments/environment";
import { BaseService } from "./base.service";
import type { LocationRequest } from "../../models/api/requests/location.request";
import type { Location } from "../../models/api/responses/location.model";

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
}
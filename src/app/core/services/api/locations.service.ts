import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../../../../environments/environment";
import { Location } from "../../models/api/location.model";
import { Page } from "../../models/api/page.model";
import { LocationRequest } from "../../../features/locations/models/location.request";
import { UpdateLocationRequest } from "../../../features/locations/models/update-location.request";



@Injectable({
    providedIn: 'root'
})
export class LocationService {
    private http = inject(HttpClient);
    private domain = environment.domain;
    
    getLocations(email: string): Observable<Location[]> { // Locations for the dropdown at /login
        return this.http.get<Location[]>(`${this.domain}/auth/locations?email=${email}`);
    }

    getAllLocations(): Observable<Page<Location>> {
        return this.http.post<Page<Location>>(`${this.domain}/location/all`, {}, { withCredentials: true });
    }

    addLocation(request: LocationRequest): Observable<Location> {
        return this.http.post<Location>(`${this.domain}/location/create`, request, {withCredentials: true})
    }

    updateLocation(request: UpdateLocationRequest): Observable<Location> {
        return this.http.put<Location>(`${this.domain}/location/update`, { request }, { withCredentials: true })
    }

    deleteLocation(id: number): Observable<number> {
        return this.http.post<number>(`${this.domain}/location/delete`, { id }, { withCredentials: true })
    }
}
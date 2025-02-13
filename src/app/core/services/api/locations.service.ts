import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../../../../environments/environment";
import { Location } from "../../models/api/location.model";
import { Page } from "../../models/api/page.model";



@Injectable({
    providedIn: 'root'
})
export class LocationServvice {
    private http = inject(HttpClient);
    private domain = environment.domain;
    
    getLocations(email: string): Observable<Location[]> {
        return this.http.get<Location[]>(`${this.domain}/auth/locations?email=${email}`);
    }

    getAllLocations(): Observable<Page<Location>> {
        return this.http.post<Page<Location>>(`${this.domain}/location/all`, {}, { withCredentials: true });
    }
}
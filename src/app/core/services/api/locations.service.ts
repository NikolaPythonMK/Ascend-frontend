import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../../../../environments/environment";
import { Location } from "../../models/api/location.model";



@Injectable({
    providedIn: 'root'
})
export class LocationServvice {
    private http = inject(HttpClient);
    private domain = environment.domain;
    
    getLocations(email: string): Observable<Location[]> {
        return this.http.get<Location[]>(`${this.domain}/auth/locations?email=${email}`);
    }
}
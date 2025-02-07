import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "../../../../environments/environment";
import { Observable } from "rxjs";
import { Page } from "../../models/api/page.model";


@Injectable({
    providedIn: 'root'
})
export class StaffService {
    private http = inject(HttpClient);
    private domain = environment.domain;

    

    // getAll(): Observable<Page<StaffUser>> {

    // }

}
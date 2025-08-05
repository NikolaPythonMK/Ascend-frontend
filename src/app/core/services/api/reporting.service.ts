import { inject, Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../../../environments/environment";
import { Observable } from "rxjs";
import { DynamicQuery } from "../../../features/reports-dashboard/report-dashboard.component";


@Injectable({
    providedIn: 'root'
})
export class ReportingService{
    protected http = inject(HttpClient);
    protected domain = environment.domain; 
    protected endpoint = 'reporting';

    execute(request: DynamicQuery | FormData): Observable<object> {
        return this.http.post<object>(`${this.domain}/${this.endpoint}/execute`, request, { withCredentials: true })
    }
    
    chartdata(): Observable<number[]> {
        return this.http.post<number[]>(`${this.domain}/${this.endpoint}/chart-data`, {}, { withCredentials: true })
    }
}
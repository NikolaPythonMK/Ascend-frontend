import { inject, Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../../../environments/environment";
import { Observable } from "rxjs";
import { DynamicQuery } from "../../../features/reports-dashboard/report-dashboard.component";
import { EntityInfo, PropertyInfo } from "../../../features/reports/dynamic-report.component";
import { BaseService } from "./base.service";
import { ReportRequest } from "../../models/api/requests/report.request";
import { Report } from "../../models/api/responses/report.model";


@Injectable({
    providedIn: 'root'
})
export class ReportingService extends BaseService<Report, ReportRequest> {
    protected override http = inject(HttpClient);
    protected override domain = environment.domain;

    constructor() {
        super('reporting');
    }

    getEntities(): Observable<EntityInfo[]> {
        return this.http.get<EntityInfo[]>(`${this.domain}/reporting/entities`, { withCredentials: true })
    }

    getEntityDetails(entityName: string): Observable<PropertyInfo[]> {
        return this.http.get<PropertyInfo[]>(`${this.domain}/reporting/entities/${entityName}/properties`, { withCredentials: true })
    }

    execute(request: DynamicQuery | FormData): Observable<object> {
        return this.http.post<object>(`${this.domain}/reporting/execute`, request, { withCredentials: true })
    }
    
    chartdata(): Observable<number[]> {
        return this.http.post<number[]>(`${this.domain}/reporting/chart-data`, {}, { withCredentials: true })
    }
}
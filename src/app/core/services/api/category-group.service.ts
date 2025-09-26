import { inject, Injectable } from "@angular/core";
import { BaseService } from "./base.service";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../../../environments/environment";
import type { CategoryGroupRequest } from "../../models/api/requests/category-group.request";
import type { CategoryGroup } from "../../models/api/responses/category-group.model";
import { Observable } from "rxjs";
import { LookupModel } from "../../models/api/responses/lookup-model";

@Injectable({
    providedIn: 'root'
})
export class CategoryGroupService extends BaseService<CategoryGroup, CategoryGroupRequest> {
    protected override http = inject(HttpClient);
    protected override domain = environment.domain;

    constructor() {
        super('categorygroup');
    }

    lookUp(): Observable<LookupModel[]> {
        return this.http.post<LookupModel[]>(`${this.domain}/categorygroup/lookup`, { }, { withCredentials: true });
    }    
}
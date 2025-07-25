import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "../../../../environments/environment";
import { BaseService } from "./base.service";
import { Discount } from "../../models/api/responses/discount.model";
import { DiscountRequest } from "../../models/api/requests/discount.request";

@Injectable({
    providedIn: 'root'
})
export class DiscountService extends BaseService<Discount, DiscountRequest> {
    protected override http = inject(HttpClient);
    protected override domain = environment.domain;

    constructor() {
        super('discount');
    }
}
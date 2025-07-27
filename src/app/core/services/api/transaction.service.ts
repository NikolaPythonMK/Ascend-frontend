import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "../../../../environments/environment";
import { BaseService } from "./base.service";
import { TransactionRequest } from "../../models/api/requests/transaction.request";
import { Transaction } from "../../models/api/responses/transaction.model";

@Injectable({
    providedIn: 'root'
})
export class TransactionService extends BaseService<Transaction, TransactionRequest> {
    protected override http = inject(HttpClient);
    protected override domain = environment.domain;

    constructor(){
        super('transaction')
    }
}
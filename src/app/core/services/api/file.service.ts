import { inject, Injectable } from "@angular/core";
import { BaseService } from "./base.service";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../../../environments/environment";
import { FileRequest } from "../../models/api/requests/file.request";

@Injectable({
    providedIn: 'root'
})
export class FileService extends BaseService<File, FileRequest> {
    protected override http = inject(HttpClient);
    protected override domain = environment.domain;

    constructor() {
        super('filedetails');
    }
}
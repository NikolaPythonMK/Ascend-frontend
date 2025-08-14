import { inject, Injectable } from "@angular/core";
import { Observable, tap } from "rxjs";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../../../environments/environment";
import { EmployeeStore } from "../../../core/store/employee.store";
import type { StaffUser } from "../../../core/models/api/responses/staff-user.model";
import { SettingsManagerService } from "../../../core/services/utility/settings-manager.service";
import { Router } from "@angular/router";


@Injectable({
    providedIn: 'root'
})
export class StaffAuthService {
    private http = inject(HttpClient);
    private domain = environment.domain;
    private staffStore = inject(EmployeeStore);
    private readonly settingsManager = inject(SettingsManagerService);
    private readonly router = inject(Router);

    login(code: string): Observable<StaffUser> {
        return this.http.post<StaffUser>(`${this.domain}/staffuser/login`, { code }, { withCredentials: true })
            .pipe(
                tap((staff: StaffUser) => {
                    if(staff){
                        this.staffStore.setEmployee(staff);
                    }
                })
            )
    }

    logout(): void {
        this.settingsManager.removeStaffSettings();
        this.staffStore.clearStore();
        this.router.navigate(['/staff']);
    }
}
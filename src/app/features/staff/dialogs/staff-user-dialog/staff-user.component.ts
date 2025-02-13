import { CommonModule } from "@angular/common";
import { Component, inject, OnInit, signal } from "@angular/core";
import { AbstractControl, FormBuilder, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatDialogRef } from "@angular/material/dialog";
import { MatFormField, MatFormFieldModule, MatLabel } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { RolesService } from "../../../../core/services/api/roles.service";
import { Page } from "../../../../core/models/api/page.model";
import { Role } from "../../../../core/models/api/role.model";
import { MatSelectModule } from "@angular/material/select";
import type { StaffUserRequest } from "../../models/staff-user.request";
import { StaffService } from "../../../../core/services/api/staff.service";
import { HttpErrorResponse } from "@angular/common/http";
import { StaffUser } from "../../../../core/models/api/staff-user.model";
import { SnackbarService } from "../../../../core/services/utility/snackbar.service";
import { ButtonComponent } from "../../../../core/ui/button/button.component";

@Component({
    imports: [MatFormFieldModule, MatLabel, ReactiveFormsModule, CommonModule, MatInputModule, MatButtonModule, MatSelectModule, FormsModule, ButtonComponent],
    templateUrl: 'staff-user.component.html',
    styleUrls: ['staff-user.component.scss']
})
export class StaffUserDialog implements OnInit{
    private readonly fb = inject(FormBuilder);
    readonly dialogRef = inject(MatDialogRef<StaffUserDialog>);
    readonly rolesService = inject(RolesService);
    readonly staffService = inject(StaffService);
    readonly snackbarService = inject(SnackbarService);
    roles = signal<Role[]>([])

    staffUser = this.fb.group({
        name: ['', Validators.required],
        code: ['', Validators.required],
        selectedRoles: []
    })

    getSelectedRolesControl(): AbstractControl {
        return this.staffUser.get('selectedRoles')!;
    }

    getNameControl(): AbstractControl {
        return this.staffUser.get('name')!;
    }

    getCodeControl(): AbstractControl {
        return this.staffUser.get('code')!;
    }

    ngOnInit(): void {
        this.rolesService.getRoles().subscribe((result: Page<Role>) => {
            this.roles.set(result.data);
        })
    }

    onSubmit(): void {
        if (this.staffUser.invalid){
            return;
        }
        const request: StaffUserRequest = {
            name: this.getNameControl().value,
            code: this.getCodeControl().value,
            staffUserRoles: this.getSelectedRolesControl().value
        }
        this.staffService.addStaffUser(request).subscribe({
            next: (staffUser: StaffUser) => {
                this.snackbarService.success('Успешно');
                this.dialogRef.close(staffUser);
            },
            error: (error: HttpErrorResponse) => {
                this.snackbarService.error(error.message);
                this.dialogRef.close();
            }
        })
    }

    getRoleName(id: number): string {
        return this.roles().find(i => i.id === id)?.name ?? '';
    }
}
import { Component, inject, OnInit, signal } from "@angular/core";
import { AbstractControl, FormBuilder, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatDialogRef } from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { ButtonComponent } from "../../../../core/ui/button/button.component";
import { RolesService } from "../../../../core/services/api/roles.service";
import { HttpErrorResponse } from "@angular/common/http";
import { Page } from "../../../../core/models/api/page.model";
import type { Permission } from "../../../../core/models/api/responses/permission.model";
import { PermissionsService } from "../../../../core/services/api/permissions.service";
import type { RoleRequest } from "../../../../core/models/api/requests/role.request";
import { TranslateModule } from "@ngx-translate/core";

@Component({
    imports: [MatFormFieldModule, MatSelectModule, FormsModule, ReactiveFormsModule, MatInputModule, ButtonComponent, TranslateModule],
    templateUrl: 'roles-dialog.component.html',
    styleUrls: ['roles-dialog.component.scss']
})
export class RolesDialog implements OnInit{
    readonly dialogRef = inject(MatDialogRef<RolesDialog>);
    readonly rolesService = inject(RolesService);
    readonly permissionsService = inject(PermissionsService)
    readonly fb = inject(FormBuilder);
    permissions = signal<Permission[]>([]);
    roleForm = this.fb.group({
        name: ['', Validators.required],
        permissions: [[], Validators.required]
    })

    ngOnInit(): void {
        this.permissionsService.getAll().subscribe({
            next: (permissions: Page<Permission>) => {
                this.permissions.set(permissions.data)
            },
            error: (error: HttpErrorResponse) => {
                console.log(error);
            }
        })
    }

    getName(): AbstractControl {
        return this.roleForm.get('name')!;
    }

    getPermissions(): AbstractControl {
        return this.roleForm.get('permissions')!;
    }

    onSubmit(): void {
        if (this.roleForm.invalid){
            return;
        }
        const addRoleRequest: RoleRequest = {
            name: this.getName().value,
            rolePermissions: this.getPermissions().value
        }
        this.dialogRef.close(addRoleRequest);
    }

    onClose(): void {
        this.dialogRef.close();
    }
}
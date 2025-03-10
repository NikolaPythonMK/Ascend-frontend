import { ChangeDetectorRef, Component, inject, OnInit, QueryList, signal, ViewChildren } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";
import { ButtonComponent } from "../../../../core/ui/button/button.component";
import { MatDialog } from "@angular/material/dialog";
import { RolesService } from "../../../../core/services/api/roles.service";
import { HttpErrorResponse } from "@angular/common/http";
import { SnackbarService } from "../../../../core/services/utility/snackbar.service";
import { Page } from "../../../../core/models/api/page.model";
import { MatTableModule } from "@angular/material/table";
import {MatCheckbox, MatCheckboxChange, MatCheckboxModule} from '@angular/material/checkbox';
import { CommonModule } from "@angular/common";
import { AbstractControl, FormBuilder, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatIconModule } from "@angular/material/icon";
import { InputFieldComponent } from "../../../../core/ui/input-field/input-field.component";
import { ConfirmationDialog } from "../../../../core/ui/confirmation-dialog/confirmation-dialog.component";
import { Permission } from "../../../../core/models/api/responses/permission.model";
import { Role } from "../../../../core/models/api/responses/role.model";
import { RoleRequest } from "../../../../core/models/api/requests/role.request";
import { PermissionsService } from "../../../../core/services/api/permissions.service";

interface GroupPermission {
    groupName: string,
    permissions: Permission[]
}

interface UpdatedPermission {
    permissionId: number,
    isChecked: boolean
}


@Component({
    selector: 'roles-component',
    imports: [TranslateModule,
              ButtonComponent,
              MatTableModule,
              CommonModule,
              MatCheckboxModule,
              FormsModule,
              MatIconModule,
              InputFieldComponent,
              ReactiveFormsModule],
    templateUrl: 'roles.component.html',
    styleUrls: ['roles.component.scss']
})
export class RolesComponent implements OnInit{
    @ViewChildren('checkbox') checkboxes!: QueryList<MatCheckbox>;
    readonly dialog = inject(MatDialog);
    readonly rolesService = inject(RolesService);
    readonly permissionsService = inject(PermissionsService);
    readonly snackbarService = inject(SnackbarService);
    readonly fb = inject(FormBuilder);
    readonly cdr = inject(ChangeDetectorRef);
    toggleAddRole = signal<boolean>(false);
    roles = signal<Role[]>([]);
    selectedRole = signal<Role | null>(null);

    permissions = signal<Permission[]>([]);
    groupedPermissions = signal<GroupPermission[]>([]);
    updatedPermissions: UpdatedPermission[] = [];
    

    objectKeys: string[] = [];
    Object: any;

    roleForm = this.fb.group({
        name: ['', Validators.required],
    })
    
    ngOnInit(): void {
        this.getAllPermissions();
        this.getRoles();
    }

    getNameControl(): AbstractControl {
        return this.roleForm.get('name')!;
    }

    onAddRole(): void {
        this.toggleAddRole.set(!this.toggleAddRole());
    }

    onSubmitRole(): void {
        if(this.getNameControl().invalid){
            return;
        }
        const addRoleRequest: RoleRequest = {
            name: this.getNameControl().value,
            rolePermissions: []
        }
        this.rolesService.add(addRoleRequest).subscribe({
            next: () => {
                this.snackbarService.success('Успешно додавање улога')
                this.getRoles();
                this.toggleAddRole.set(false);

            },
            error: (error: HttpErrorResponse) => {
                this.snackbarService.error(error.message);
            }
        })
    }

    onDelete(id: number): void {
        const dialogRef = this.dialog.open(ConfirmationDialog);
        dialogRef.afterClosed().subscribe((result: boolean) => {
            if(!result){
                return;
            }
            this.rolesService.delete(id).subscribe({
                next: () => {
                    this.snackbarService.success('Успешно е избришана улогата');
                    this.getRoles();
                },
                error: (error: HttpErrorResponse) => {
                    this.snackbarService.error(error.message);
                }
            })
        })
    }

    onSelectRole(role: Role): void {
        this.rolesService.getById(role.id).subscribe({
            next: (roleSelected: Role) => {
                this.selectedRole.set(roleSelected);

            },
            error: (error: HttpErrorResponse) => {
                this.snackbarService.error(error.message);
            }
        })
    }
      
    
    private getRoles(): void {
        this.rolesService.getAll().subscribe({
            next: (roles: Page<Role>) => {
                this.roles.set(roles.data);
                this.selectedRole.set(this.roles()[0]);
                this.onSelectRole(this.roles()[0])
                console.log(this.roles())
            },
            error: (error: HttpErrorResponse) => {
                this.snackbarService.error(error.message);
            }
        })
    }

    onChangeCheckbox(checkbox: MatCheckboxChange, permission: Permission): void {
        const containsPermission = this.updatedPermissions.some(i => i.permissionId === permission.id);
        if (containsPermission) {
            this.updatedPermissions = this.updatedPermissions.filter(i => i.permissionId !== permission.id)
            return;
        }
        this.updatedPermissions.push({
            permissionId: permission.id,
            isChecked: checkbox.checked
        })
    }

    onSelectAll(checkbox: MatCheckboxChange, groupPermission: GroupPermission): void {
        const permissions = groupPermission.permissions.map(i => i.id);
        if (checkbox.checked) {
            this.updatedPermissions = this.updatedPermissions.filter(i => !permissions.includes(i.permissionId));
            groupPermission.permissions.forEach(i => {
                this.updatedPermissions.push({permissionId: i.id, isChecked: true});
                this.checkboxes.find(c => c.value === i.id.toString())!.checked = true;
            })
        } else {
            this.updatedPermissions = [];
            const staffPermissions = this.selectedRole()!.permissions?.map(i => i.id);
            this.checkboxes.filter(i => permissions.includes(Number(i.value))).forEach(i => {
                if(!staffPermissions!.includes(Number(i.value))){
                    i.checked = false;
                }
            })

            // check only the selectedRole checked checkboxes and empty the updatedPermissions
        }
    }

    hasPermission(permission: Permission): boolean {
        return this.selectedRole()?.permissions?.some(i => i.id === permission.id) ?? false;
    }

    onReset(): void {
        this.updatedPermissions.forEach(i => {
            this.checkboxes.find(c => c.value === i.permissionId.toString())!.checked = !i.isChecked
        })
        this.updatedPermissions = [];
    }

    onUpdatePermissions(): void {
        let rolePermissions: number[] = this.selectedRole()!.permissions!.map(i => i.id);
        this.updatedPermissions.forEach(i => {
            if (i.isChecked){
                rolePermissions.push(i.permissionId);
            } else {
                rolePermissions = rolePermissions.filter(p => p !== i.permissionId);
            }
        })
        const request: RoleRequest = {
            id: this.selectedRole()!.id,
            name: this.selectedRole()!.name,
            rolePermissions: rolePermissions
        }
        this.rolesService.update(request).subscribe({
            next: () => {
                this.snackbarService.success('Успешно')
                this.rolesService.getById(this.selectedRole()!.id).subscribe({
                    next: (roleSelected: Role) => {
                        this.selectedRole.set(roleSelected);
        
                    },
                    error: (error: HttpErrorResponse) => {
                        this.snackbarService.error(error.message);
                    }
                })
                
            },
            error: (error: HttpErrorResponse) => {
                this.snackbarService.error(error.message);
            }
        })
    }

    private getAllPermissions(): void {
        this.permissionsService.getAll().subscribe({
            next: (permissions: Page<Permission>) => {
                this.permissions.set(permissions.data);
                this.groupedPermissions.set(this.groupPermissions(this.permissions()))
            },
            error: (error: HttpErrorResponse) => {
                this.snackbarService.error(error.message);
            }
        })
    }

    private groupPermissions(permissions: Permission[]): GroupPermission[] {
        const groups = [
            { key: "table", groupName: "Tables" },
            { key: "product", groupName: "Products" },
            { key: "category", groupName: "Categories" },
            { key: "transaction", groupName: "Transactions" },
            { key: "role", groupName: "Roles" },
            { key: "location", groupName: "Locations" },
            { key: "revenue", groupName: "Revenue" },
            { key: "stock", groupName: "Stock" },
            { key: "report", groupName: "Reports" },
            { key: "anaylsis", groupName: "Analyses" },
        ];
    
        const groupedPermissions = groups.map(({ key, groupName }) => ({
            groupName,
            permissions: permissions.filter(p => 
                p.name.includes(`/api/${key}/`) && !p.name.includes('/id')
            )
        })).filter(group => group.permissions.length > 0); 
    
        return groupedPermissions;
    }
}
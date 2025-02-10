import { Component, inject, OnInit, signal } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";
import { ButtonComponent } from "../../../../core/ui/button/button.component";
import { RolesDialog } from "../../dialogs/roles-dialog/roles-dialog.component";
import { MatDialog } from "@angular/material/dialog";
import { RolesService } from "../../../../core/services/api/roles.service";
import { HttpErrorResponse } from "@angular/common/http";
import { SnackbarService } from "../../../../core/services/utility/snackbar.service";
import { Page } from "../../../../core/models/api/page.model";
import { Role } from "../../../../core/models/api/role.model";
import { AddRoleRequest } from "../../models/add-role.request";
import { Permission } from "../../../../core/models/api/permission.model";
import { MatButtonModule } from "@angular/material/button";
import { MatTableModule } from "@angular/material/table";
import {MatCheckboxModule} from '@angular/material/checkbox';
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { MatIconModule } from "@angular/material/icon";
import { PermissionDTO } from "../../../../core/models/dto/permission.dto";


@Component({
    selector: 'roles-component',
    imports: [TranslateModule, ButtonComponent, MatTableModule, CommonModule, MatCheckboxModule, FormsModule, MatIconModule],
    templateUrl: 'roles.component.html',
    styleUrls: ['roles.component.scss']
})
export class RolesComponent implements OnInit{
    readonly dialog = inject(MatDialog);
    readonly rolesService = inject(RolesService);
    readonly snackbarService = inject(SnackbarService);
    roles = signal<Role[]>([]);
    // permissions = signal<Permission[]>([]);
    selectedRole = signal<Role | null>(null);
    groupedPermissions: Record<string, Permission[]> = {};
Object: any;
    
    ngOnInit(): void {
        this.getRoles();
        // this.getPermissions();
    }

    onAddRole(): void {
        const dialogRef = this.dialog.open(RolesDialog);
        dialogRef.afterClosed().subscribe((result: AddRoleRequest) => {
            if(!result) {
                return;
            }
            this.rolesService.addRole(result).subscribe({
                next: () => {
                    this.getRoles();
                },
                error: (error: HttpErrorResponse) => {
                    this.snackbarService.error(error.message);
                }
            })
        })
    }

    onSelectRole(role: Role): void {
        this.selectedRole.set(role);
        this.rolesService.getById(role.id).subscribe({
            next: (roleSelected: Role) => {
                this.selectedRole.set(roleSelected);
                console.log('ERR');
                this.groupedPermissions = this.groupPermissions(this.selectedRole()?.permissions || []);
                console.log('=> ', this.groupedPermissions)
                //role, create, delete, id, getall ->
            },
            error: (error: HttpErrorResponse) => {
                this.snackbarService.error(error.message);
            }
        })
    }
      
    groupPermissions(permissions: Permission[]): Record<string, Permission[]> {
        return permissions.reduce((acc, permission) => {
            // Split the permission name by `/`
            const parts = permission.name.split('/');
            
            // Get the second-to-last part
            const key = parts.length > 1 ? parts[parts.length - 2] : "Other";
    
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(permission);
            return acc;
        }, {} as Record<string, Permission[]>);
    }    
    
    private getRoles(): void {
        this.rolesService.getRoles().subscribe({
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

    // private getPermissions(): void {
    //     this.rolesService.getPermissions().subscribe((permissions: Page<Permission>) => {
    //         this.permissions.set(permissions.data);
    //     })
    // }
}
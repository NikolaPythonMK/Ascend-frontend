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
import { MatButtonToggleGroup } from "@angular/material/button-toggle";
import { CommonModule } from "@angular/common";

@Component({
    selector: 'roles-component',
    imports: [TranslateModule, ButtonComponent, MatTableModule, CommonModule],
    templateUrl: 'roles.component.html',
    styleUrls: ['roles.component.scss']
})
export class RolesComponent implements OnInit{
    readonly dialog = inject(MatDialog);
    readonly rolesService = inject(RolesService);
    readonly snackbarService = inject(SnackbarService);
    roles = signal<Role[]>([]);
    permissions = signal<Permission[]>([]);



    ngOnInit(): void {
        this.getRoles();
        this.getPermissions();
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

    private getRoles(): void {
        this.rolesService.getRoles().subscribe({
            next: (roles: Page<Role>) => {
                this.roles.set(roles.data);
                console.log('test: ', this.roles()[3].name)
                console.log('test: ', this.roles()[3].rolePermissions)
                console.log('test: ', this.roles()[3].permissions)
            },
            error: (error: HttpErrorResponse) => {
                this.snackbarService.error(error.message);
            }
        })
    }

    private getPermissions(): void {
        this.rolesService.getPermissions().subscribe((permissions: Page<Permission>) => {
            this.permissions.set(permissions.data);
        })
    }
}
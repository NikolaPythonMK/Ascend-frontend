import { CommonModule } from "@angular/common";
import { Component, inject, OnInit, signal } from "@angular/core";
import { AbstractControl, FormBuilder, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from "@angular/material/dialog";
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
import { MatIconModule } from "@angular/material/icon";
import { ConfirmationDialog } from "../../../../core/ui/confirmation-dialog/confirmation-dialog.component";

@Component({
    imports: [MatFormFieldModule, MatLabel, ReactiveFormsModule, CommonModule, MatInputModule, MatButtonModule, MatSelectModule, FormsModule, ButtonComponent, MatIconModule],
    templateUrl: 'staff-user.component.html',
    styleUrls: ['staff-user.component.scss']
})
export class StaffUserDialog implements OnInit{
    private readonly fb = inject(FormBuilder);
    readonly dialogRef = inject(MatDialogRef<StaffUserDialog>);
    readonly dialog = inject(MatDialog);
    readonly rolesService = inject(RolesService);
    readonly staffService = inject(StaffService);
    readonly snackbarService = inject(SnackbarService);
    readonly data = inject<StaffUser>(MAT_DIALOG_DATA);
    roles = signal<Role[]>([])
    title = signal<string>('Add New Staff');
    submitBtnlabel = signal<string>('Додади');

    staffUser = this.fb.group({
        name: ['', Validators.required],
        code: ['', Validators.required],
        lastname: ['', Validators.required],
        phoneNumber: ['', Validators.required],
        selectedRoles: []
    })

    getSelectedRolesControl(): AbstractControl {
        return this.staffUser.get('selectedRoles')!;
    }

    getNameControl(): AbstractControl {
        return this.staffUser.get('name')!;
    }

    getLastNameControl(): AbstractControl {
        return this.staffUser.get('lastName')!;
    }

    getPhoneNumberControl(): AbstractControl {
        return this.staffUser.get('phoneNumber')!;
    }

    getCodeControl(): AbstractControl {
        return this.staffUser.get('code')!;
    }

    ngOnInit(): void {
        if (this.data) {
            this.title.set('Update Staff');
            this.submitBtnlabel.set('Ажурирај');
            this.getNameControl().setValue(this.data.name);
            this.getCodeControl().setValue(this.data.code);
            this.getSelectedRolesControl().setValue(this.data.staffUserRoles?.map(i => i.id))
        }

        this.rolesService.getRoles().subscribe((result: Page<Role>) => {
            this.roles.set(result.data);
        })
    }

    onSubmit(): void {
        if (this.staffUser.invalid) {
            return;
        }
    
        const request: StaffUserRequest = {
            id: this.data?.id, // Include id only if updating
            name: this.getNameControl().value,
            lastName: this.get
            code: this.getCodeControl().value,
            staffUserRoles: this.getSelectedRolesControl().value
        };
    
        const action$ = this.data 
            ? this.staffService.updateStaffUser(request)  // Update if data exists
            : this.staffService.addStaffUser(request);   // Create new if no data
    
        action$.subscribe({
            next: (staffUser: StaffUser) => {
                this.snackbarService.success('Успешно');
                this.dialogRef.close(staffUser);
            },
            error: (error: HttpErrorResponse) => {
                this.snackbarService.error(error.message);
                this.dialogRef.close();
            }
        });
    }

    onDelete(): void {
        const dialogRef = this.dialog.open(ConfirmationDialog);
        dialogRef.afterClosed().subscribe((isConfirmed: boolean) => {
            if(!isConfirmed) {
                return;
            }
            this.staffService.deleteStaffUser(this.data.id!).subscribe({
                next: (result: number) => {
                    this.snackbarService.success('Успешно');
                    this.dialogRef.close(result);
                },
                error: (error: HttpErrorResponse) => {
                    this.snackbarService.error(error.message);
                    this.dialogRef.close();
                } 
            })
        })
    }
    

    getRoleName(id: number): string {
        return this.roles().find(i => i.id === id)?.name ?? '';
    }
}
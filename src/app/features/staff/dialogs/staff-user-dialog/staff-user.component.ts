import { CommonModule } from "@angular/common";
import { Component, computed, inject, OnInit, signal } from "@angular/core";
import { AbstractControl, FormBuilder, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from "@angular/material/dialog";
import { MatFormFieldModule, MatLabel } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { RolesService } from "../../../../core/services/api/roles.service";
import type { Page } from "../../../../core/models/api/page.model";
import { MatSelectModule } from "@angular/material/select";
import { StaffService } from "../../../../core/services/api/staff.service";
import { HttpErrorResponse } from "@angular/common/http";
import { SnackbarService } from "../../../../core/services/utility/snackbar.service";
import { ButtonComponent } from "../../../../core/ui/button/button.component";
import { MatIconModule } from "@angular/material/icon";
import { ConfirmationDialog } from "../../../../core/ui/confirmation-dialog/confirmation-dialog.component";
import type { StaffUserRequest } from "../../../../core/models/api/requests/staff-user.request";
import type { Role } from "../../../../core/models/api/responses/role.model";
import type { StaffUser } from "../../../../core/models/api/responses/staff-user.model";
import { LoaderComponent } from "../../../../core/ui/loader/loader.component";
import { TranslateModule } from "@ngx-translate/core";
import TranslationService from "../../../../core/services/utility/translation.service";
import { PermissionService } from "../../../../core/services/auth/permission.service";
import { LookupModel } from "../../../../core/models/api/responses/lookup-model";

@Component({
    imports: [MatFormFieldModule, 
        MatLabel, 
        ReactiveFormsModule, 
        CommonModule, 
        MatInputModule, 
        MatButtonModule, 
        MatSelectModule, 
        FormsModule, 
        ButtonComponent, 
        MatIconModule, 
        LoaderComponent,
        TranslateModule],
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
    readonly data = inject<number>(MAT_DIALOG_DATA);
    readonly translationService = inject(TranslationService);
    private authz = inject(PermissionService);
    
    canUpdate = computed(() =>
            this.authz.has({ name: '/api/staffuser/update', method: 'PUT' })
    );

    canDelete = computed(() =>
            this.authz.has({ name: '/api/staffuser/delete', method: 'POST' })
    );

    roles = signal<LookupModel[]>([])
    title = signal<string>(this.translationService.getTranslationForKey("staff.personal.add-staff"));
    submitBtnlabel = signal<string>(this.translationService.getTranslationForKey("shared.add"));
    loading = signal<boolean>(false);

    staffUser = this.fb.group({
        name: ['', Validators.required],
        code: ['', Validators.required],
        lastName: '',
        phoneNumber: '',
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
        this.rolesService.lookUp().subscribe((result: LookupModel[]) => {
            this.roles.set(result);
        })

        if (this.data) {
                this.loading.set(true);
                this.title.set(this.translationService.getTranslationForKey("staff.personal.update-staff"));
                this.submitBtnlabel.set(this.translationService.getTranslationForKey("shared.update"));
                this.staffService.getById(this.data).subscribe({
                    next: (user: StaffUser) => {
                        this.getNameControl().setValue(user.name);
                        this.getCodeControl().setValue(user.code);
                        this.getLastNameControl().setValue(user.lastName);
                        this.getPhoneNumberControl().setValue(user.phoneNumber);
                        this.getSelectedRolesControl().setValue(user.staffUserRoles?.map(i => i.id))
                        this.loading.set(false);
                    },
                    error: (error: HttpErrorResponse) => {
                        this.snackbarService.error(error.message)
                    }
                })
            }
    }

    onSubmit(): void {
        if (this.staffUser.invalid) {
            return;
        }
    
        const request: StaffUserRequest = {
            id: this.data == null ? 0 : this.data,
            name: this.getNameControl().value,
            lastName: this.getLastNameControl().value,
            phoneNumber: this.getPhoneNumberControl().value,
            code: this.getCodeControl().value,
            staffUserRoles: this.getSelectedRolesControl().value
        };
    
        const action$ = this.data 
            ? this.staffService.update(request)  // Update if data exists
            : this.staffService.add(request);   // Create new if no data
    
        action$.subscribe({
            next: (staffUser: StaffUser) => {
                this.snackbarService.success(`${this.translationService.getTranslationForKey("shared.succesfully")} ${this.translationService.getTranslationForKey("shared.added")}`);
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
            this.staffService.delete(this.data).subscribe({
                next: (result: number) => {
                    this.snackbarService.success(`${this.translationService.getTranslationForKey("shared.succesfully")} ${this.translationService.getTranslationForKey("shared.deleted")}`);
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

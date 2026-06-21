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
import { EmployeeStore } from "../../../../core/store/employee.store";

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
    private readonly employee = inject(EmployeeStore);
    private authz = inject(PermissionService);
    
    canUpdate = computed(() =>
            this.authz.has({ name: '/api/staffuser/update', method: 'PUT' })
    );
    isAdmin = this.authz.isAdmin;
    isOwnProfile = computed(() =>
        this.data != null && this.data === this.employee.id()
    );
    canEditBasicDetails = computed(() =>
        !this.data
        || this.isOwnProfile()
        || (this.canUpdate() && (this.isAdmin() || !this.targetIsAdmin()))
    );
    canEditRoles = computed(() =>
        !this.data
        || (
            this.canUpdate()
            && !this.isOwnProfile()
            && (this.isAdmin() || !this.targetIsAdmin())
        )
    );

    canDelete = computed(() =>
            this.authz.has({ name: '/api/staffuser/delete', method: 'POST' })
    );
    targetIsAdmin = signal<boolean>(false);
    canDeleteTarget = computed(() =>
        this.canDelete() && (this.isAdmin() || !this.targetIsAdmin())
    );

    roles = signal<LookupModel[]>([])
    title = signal<string>(this.translationService.getTranslationForKey("staff.personal.add-staff"));
    submitBtnlabel = signal<string>(this.translationService.getTranslationForKey("shared.add"));
    loading = signal<boolean>(false);
    showCodeInput = signal<boolean>(!this.data);

    staffUser = this.fb.group({
        name: ['', Validators.required],
        code: [''],
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
        this.configureCodeControl(this.showCodeInput());
        this.configureRolesControl();

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
                        const hasVisibleCode =
                            this.isAdmin() &&
                            !this.isOwnProfile() &&
                            user.code != null;
                        this.showCodeInput.set(hasVisibleCode);
                        this.configureCodeControl(hasVisibleCode);
                        if (hasVisibleCode) {
                            this.getCodeControl().setValue(user.code);
                        }
                        this.getLastNameControl().setValue(user.lastName);
                        this.getPhoneNumberControl().setValue(user.phoneNumber);
                        this.targetIsAdmin.set(
                            user.staffUserRoles?.some(role =>
                                role.name?.trim().toLowerCase() === 'admin')
                            ?? false
                        );
                        this.getSelectedRolesControl().setValue(user.staffUserRoles?.map(i => i.id))
                        this.configureRolesControl();
                        this.loading.set(false);
                    },
                    error: (error: HttpErrorResponse) => {
                        this.snackbarService.error(error.message)
                    }
                })
            }
    }

    onSubmit(): void {
        if (!this.canEditBasicDetails() || this.staffUser.invalid) {
            return;
        }
    
        const request: StaffUserRequest = {
            id: this.data == null ? 0 : this.data,
            name: this.getNameControl().value,
            lastName: this.getLastNameControl().value,
            phoneNumber: this.getPhoneNumberControl().value,
        };

        if (this.showCodeInput()) {
            request.code = this.getCodeControl().value;
        }

        if (this.canEditRoles()) {
            request.staffUserRoles = this.getSelectedRolesControl().value;
        }
    
        const action$ = this.data 
            ? this.staffService.update(request)  // Update if data exists
            : this.staffService.add(request);   // Create new if no data
    
        action$.subscribe({
            next: (staffUser: StaffUser) => {
                if (this.isOwnProfile()) {
                    this.employee.updatePersonalDetails({
                        name: request.name,
                        lastName: request.lastName,
                        phoneNumber: request.phoneNumber,
                    });
                }
                this.snackbarService.success(`${this.translationService.getTranslationForKey("shared.succesfully")} ${this.translationService.getTranslationForKey("shared.added")}`);
                this.dialogRef.close(staffUser);
            },
            error: (error: HttpErrorResponse) => {
                const detail = error.error?.detail;
                this.snackbarService.error(
                    detail
                        ? this.translationService.getTranslationForKey(detail)
                        : error.message
                );
            }
        });
    }

    onDelete(): void {
        if (!this.canDeleteTarget()) {
            return;
        }

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
                    const detail = error.error?.detail;
                    this.snackbarService.error(
                        detail
                            ? this.translationService.getTranslationForKey(detail)
                            : error.message
                    );
                } 
            })
        })
    }
    

    getRoleName(id: number): string {
        return this.roles().find(i => i.id === id)?.name ?? '';
    }

    isAdminRole(role: LookupModel): boolean {
        return role.name.trim().toLowerCase() === 'admin';
    }

    private configureCodeControl(required: boolean): void {
        const codeControl = this.getCodeControl();
        if (required) {
            codeControl.setValidators(Validators.required);
        } else {
            codeControl.clearValidators();
            codeControl.setValue('');
        }
        codeControl.updateValueAndValidity();
    }

    private configureRolesControl(): void {
        const rolesControl = this.getSelectedRolesControl();
        if (this.canEditRoles()) {
            rolesControl.enable();
        } else {
            rolesControl.disable();
        }
    }
}

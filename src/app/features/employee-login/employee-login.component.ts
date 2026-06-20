import { AfterViewInit, Component, ElementRef, HostListener, inject, signal } from "@angular/core";
import { Router } from "@angular/router";
import { EmployeeStore } from "../../core/store/employee.store";
import { AbstractControl, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { StaffAuthService } from "./services/staff-auth.service";
import { finalize } from "rxjs";
import { LoaderComponent } from "../../core/ui/loader/loader.component";
import { HttpErrorResponse } from "@angular/common/http";
import { TranslateModule } from "@ngx-translate/core";
import { MatIcon } from "@angular/material/icon";
import { SettingsManagerService } from "../../core/services/utility/settings-manager.service";
import { StaffUser } from "../../core/models/api/responses/staff-user.model";
import { OrganizationService } from "../../core/services/api/organization.service";

@Component({
    selector: 'ascend-employee-login',
    imports: [ReactiveFormsModule, FormsModule, LoaderComponent, TranslateModule, MatIcon],
    templateUrl: 'employee-login.component.html',
    styleUrls: ['employee-login.component.scss']
})
export class EmployeeLoginComponent implements AfterViewInit{
    router = inject(Router);
    employeeStore = inject(EmployeeStore);
    staffAuthService = inject(StaffAuthService);
    organizationSerivice = inject(OrganizationService);
    loading = signal(false);
    private readonly settingsManager = inject(SettingsManagerService);

    elRef = inject(ElementRef);
    errorKey?: string;

    focusOnPinInput = true;

    pinEntryForm = new FormGroup({
        pin: new FormControl('', Validators.required)
    })

    ngAfterViewInit() {
        setTimeout(() => {
            const input = document.querySelector('input[type="password"]') as HTMLInputElement;
            if (input) {
                input.focus();
            }
        }, 0);
    }

    getPinControl(): AbstractControl {
        return this.pinEntryForm.get('pin')!;
    }


    onSubmit(): void {
        this.loading.set(true);
        this.staffAuthService.login(this.getPinControl().value).pipe(
            finalize(() => this.loading.set(false))
        )
        .subscribe({
            next: (response: StaffUser) => {
                console.log('staf: ', response
                    
                )
                if (!this.settingsManager.businessProfile() || !this.settingsManager.organizationPreferences()) {
                    this.organizationSerivice.getSettings().subscribe({
                        next: (settings) => {
                            this.settingsManager.setUpOrganizationSettings(settings.businessProfile, settings.organizationPreferences);
                        },
                        error: (error) => {
                            console.error('Failed to fetch organization settings:', error);
                        }
                    })
                }
                this.settingsManager.setUpStaffSettings(response.staffPreferences!);
                this.router.navigate(['/tables']);
            },
            error: (error: HttpErrorResponse) => {
                console.log(error.error);
                this.errorKey = error.error.detail;
            }
        })
    }

     onFocus() {
    // Logic to keep the focus on the input if necessary.
  }

  onTab(event: Event) {
    event.preventDefault();  // Prevent tabbing to other elements
    // Optionally, you can focus on the same input again to keep it in place
    const inputElement = event.target as HTMLInputElement;
    inputElement.focus();
  }

  onCloseErrorMessage(): void {
        this.errorKey = '';
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const inputElement = this.elRef.nativeElement.querySelector('input');
    
    // Check if the clicked element is not the input element
    if (this.focusOnPinInput && !inputElement.contains(event.target as Node)) {
      // Prevent the focus from leaving the input by refocusing it
      inputElement.focus();
    }
  }
}

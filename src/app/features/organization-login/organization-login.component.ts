import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { TranslateModule } from '@ngx-translate/core';
import { Router, RouterLink } from '@angular/router';
import { SnackbarService } from '../../core/services/utility/snackbar.service';
import { HttpErrorResponse } from '@angular/common/http';
import { LoginRequest } from '../../core/models/login.request';
import { OrganizationService } from '../../core/services/api/organization.service';
import { InputFieldComponent } from '../../core/ui/input-field/input-field.component';
import { LocationService } from '../../core/services/api/locations.service';
import { MatSelectModule } from '@angular/material/select';
import { Location } from '../../core/models/api/responses/location.model';
import { LoginResponse } from '../../core/models/api/responses/login-response';
import { finalize } from 'rxjs';
import { LoaderComponent } from '../../core/ui/loader/loader.component';
import TranslationService from '../../core/services/utility/translation.service';
import { SettingsManagerService } from '../../core/services/utility/settings-manager.service';

@Component({
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    TranslateModule,
    CommonModule,
    MatIconModule,
    InputFieldComponent,
    MatSelectModule,
    LoaderComponent,
    RouterLink
],
  templateUrl: 'organization-login.component.html',
  styleUrls: ['organization-login.component.scss'],
})
export class OrganizationLoginPage {
  private organizationService = inject(OrganizationService);
  private router = inject(Router);
  private snackbarService = inject(SnackbarService);
  private locationService = inject(LocationService);
  private translationService = inject(TranslationService);
  private settingsManagerService = inject(SettingsManagerService);

  private fb = inject(FormBuilder);

  loginForm = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
    location: ['', Validators.required]
  });

  locations = signal<Location[]>([]);
  
  formSubmitted: boolean = false;
  errorKey?: string;

  loading = signal<boolean>(false);

  getUsernameControl(): AbstractControl {
    return this.loginForm.get('username')!;
  }

  getPasswordControl(): AbstractControl {
    return this.loginForm.get('password')!;
  }

  getLocationControl(): AbstractControl {
    return this.loginForm.get('location')!;
  }

  onCloseErrorMessage(): void {
    this.errorKey = '';
  }

  onEmailBlur(): void {
    this.locationService.getLocations(this.getUsernameControl().value).subscribe((locations: Location[]) => {
      this.locations.set(locations);
    })
  }

  onSubmit(): void {
    this.formSubmitted = true;
    if (this.loginForm.invalid) {
      return;
    }

    const loginRequest: LoginRequest = {
      userName: this.getUsernameControl().value,
      password: this.getPasswordControl().value,
      locationID: this.getLocationControl().value
    };

    this.loading.set(true);

    const result = this.organizationService
      .login(loginRequest).pipe(
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (response: LoginResponse) => { //TODO: handling if one of the settings is null
          localStorage.setItem('location', response.locationID.toString())
          this.settingsManagerService.setUpOrganizationSettings(response.businessProfile, response.organizationPreferences);
          this.translationService.applyConfiguredLanguage();
          this.snackbarService.success(this.translationService.getTranslationForKey("auth.login-succesfull"));
          this.router.navigate([`/staff`]);
        },
        error: (error: HttpErrorResponse) => {
          this.errorKey = error.error.message;
        },
      });
  }
}

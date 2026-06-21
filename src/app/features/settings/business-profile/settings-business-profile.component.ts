import { Component, OnInit, inject, signal } from "@angular/core";
import { ReactiveFormsModule, FormBuilder, Validators } from "@angular/forms";
import { TranslateModule } from "@ngx-translate/core";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { MatOptionModule } from "@angular/material/core";
import { LoaderComponent } from "../../../core/ui/loader/loader.component";
import { ButtonComponent } from "../../../core/ui/button/button.component";

import { Currency } from "../../../core/models/enums/currency.enum";
import { SettingsManagerService } from "../../../core/services/utility/settings-manager.service";
import { BusinessProfile } from "../../../core/models/api/responses/business-profile.model";
import { BusinessProfileRequest } from "../../../core/models/api/requests/business-profile.request";
import { EmployeeStore } from "../../../core/store/employee.store";
import { BusinessProfileService } from "../../../core/services/api/business-profile.service";
import { HttpErrorResponse } from "@angular/common/http";
import { finalize } from "rxjs";
import { SnackbarService } from "../../../core/services/utility/snackbar.service";
import TranslationService from "../../../core/services/utility/translation.service";

@Component({
  selector: "settings-business-profile",
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslateModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    LoaderComponent,
    ButtonComponent
  ],
  templateUrl: "settings-business-profile.component.html",
  styleUrls: ["settings-business-profile.component.scss", "../style.scss"]
})
export class SettingsBusinessProfileComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly settingsManager = inject(SettingsManagerService);
  private readonly employee = inject(EmployeeStore);
  private readonly businessProfileService = inject(BusinessProfileService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly translationService = inject(TranslationService);
  

  loading = signal<boolean>(false);
  private loadedProfile?: BusinessProfile;

  currencies = [
    { value: Currency.USD, label: "settings.businessProfile.currencies.usd" },
    { value: Currency.EUR, label: "settings.businessProfile.currencies.eur" },
    { value: Currency.MKD, label: "settings.businessProfile.currencies.mkd" },
  ];

  // Receipt language is currently not used by the application.
  // languages = [
  //   { value: Language.Default, label: "settings.preferences.options.systemDefault" },
  //   { value: Language.En,      label: "settings.preferences.options.english" },
  //   { value: Language.Mk,      label: "settings.preferences.options.macedonian" },
  // ];

  profileForm = this.fb.group({
    organizationId: [{ value: 0, disabled: true }], // read-only
    legalName: ['', [Validators.required, Validators.maxLength(200)]],
    taxId: [''],
    phoneNumber: ['', [
      Validators.required,
      // basic E.164-ish: + followed by 6-15 digits (adjust to your needs)
      //Validators.pattern(/^\+?[1-9]\d{5,14}$/)
    ]],
    email: ['', [Validators.required, Validators.email]],

    currency: [Currency.USD, Validators.required],
    // receiptLanguage: [Language.En, Validators.required],
  });

  ngOnInit(): void {
    const profile = this.settingsManager.businessProfile();
    if (!profile) {
      return;
    }

    this.hydrateForm(profile);
  }

  private hydrateForm(profile: BusinessProfile): void {
    this.loadedProfile = profile;

    this.profileForm.patchValue({
      organizationId: profile.organizationId,
      legalName: profile.legalName,
      taxId: profile.taxId,
      phoneNumber: profile.phoneNumber,
      email: profile.email,
      currency: profile.currency,
      // receiptLanguage: profile.receiptLanguage,
    });
  }

  onUpdate(): void {
    if (this.profileForm.invalid || !this.loadedProfile) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);

    const payload: BusinessProfileRequest = {
      organizationId: this.loadedProfile.organizationId,
      legalName: this.profileForm.get('legalName')!.value!,
      taxId: this.profileForm.get('taxId')!.value?.trim() || null,
      phoneNumber: this.profileForm.get('phoneNumber')!.value!,
      email: this.profileForm.get('email')!.value!,
      currency: this.profileForm.get('currency')!.value as Currency,
      // receiptLanguage: this.profileForm.get('receiptLanguage')!.value as Language,
      code: this.employee.code()!
    };

    this.businessProfileService.update(payload)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          const updatedProfile: BusinessProfile = {
            organizationId: payload.organizationId,
            legalName: payload.legalName,
            taxId: payload.taxId,
            phoneNumber: payload.phoneNumber,
            email: payload.email,
            currency: payload.currency,
            // receiptLanguage: payload.receiptLanguage,
          };

          this.loadedProfile = updatedProfile;
          this.settingsManager.businessProfile.set(updatedProfile);
          this.profileForm.markAsPristine();
          this.snackbarService.success(
            this.translationService.getTranslationForKey('shared.successfully')
          );
        },
        error: (error: HttpErrorResponse) => {
          this.snackbarService.error(error.error?.message ?? error.message);
        }
      });
  }
}

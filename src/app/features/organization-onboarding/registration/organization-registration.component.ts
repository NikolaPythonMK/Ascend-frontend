import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { CreateOrganizationRequest } from '../../../core/models/api/requests/organization-request.request';
import { Currency } from '../../../core/models/enums/currency.enum';
import { ProblemDetails } from '../../../core/models/problem-details.model';
import { OrganizationRequestsService } from '../../../core/services/api/organization-requests.service';
import TranslationService from '../../../core/services/utility/translation.service';
import { LoaderComponent } from '../../../core/ui/loader/loader.component';

@Component({
  selector: 'ascend-organization-registration',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    RouterLink,
    TranslateModule,
    LoaderComponent,
  ],
  templateUrl: './organization-registration.component.html',
  styleUrl: '../organization-onboarding.scss',
})
export class OrganizationRegistrationComponent {
  private readonly fb = inject(FormBuilder);
  private readonly organizationRequests = inject(OrganizationRequestsService);
  private readonly translation = inject(TranslationService);

  readonly currencies = [
    { value: Currency.USD, label: 'USD' },
    { value: Currency.EUR, label: 'EUR' },
    { value: Currency.MKD, label: 'MKD' },
  ];

  readonly form = this.fb.nonNullable.group({
    organizationName: ['', [Validators.required, Validators.maxLength(200)]],
    ownerFirstName: ['', [Validators.required, Validators.maxLength(100)]],
    ownerLastName: ['', [Validators.required, Validators.maxLength(100)]],
    ownerEmail: ['', [Validators.required, Validators.email]],
    businessPhoneNumber: ['', [Validators.required, Validators.maxLength(50)]],
    currency: [Currency.EUR, Validators.required],
    locationName: ['', [Validators.required, Validators.maxLength(200)]],
    numberOfTables: [
      0,
      [Validators.required, Validators.min(0), Validators.max(500)],
    ],
  });

  readonly submitting = signal(false);
  readonly submitted = signal(false);
  readonly errorMessage = signal('');

  onSubmit(): void {
    if (this.submitting() || this.submitted()) {
      return;
    }

    this.errorMessage.set('');
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      return;
    }

    const value = this.form.getRawValue();
    const request: CreateOrganizationRequest = {
      organizationName: value.organizationName.trim(),
      ownerFirstName: value.ownerFirstName.trim(),
      ownerLastName: value.ownerLastName.trim(),
      ownerEmail: value.ownerEmail.trim(),
      businessPhoneNumber: value.businessPhoneNumber.trim(),
      currency: value.currency,
      locationName: value.locationName.trim(),
      numberOfTables: value.numberOfTables,
    };

    this.submitting.set(true);
    this.organizationRequests
      .submit(request)
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => this.submitted.set(true),
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(this.getErrorMessage(error));
        },
      });
  }

  private getErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 429) {
      return this.translation.getTranslationForKey(
        'organizationOnboarding.errors.tooManyAttempts'
      );
    }

    const problem = error.error as ProblemDetails | string | null;
    if (typeof problem === 'string' && problem.trim()) {
      return problem;
    }

    const details =
      problem && typeof problem === 'object' ? problem : undefined;
    const validationMessage = Object.values(details?.errors ?? {})
      .flat()
      .find(Boolean);
    const message =
      validationMessage ??
      details?.detail ??
      'organizationOnboarding.errors.requestFailed';

    return this.translation.getTranslationForKey(message);
  }
}

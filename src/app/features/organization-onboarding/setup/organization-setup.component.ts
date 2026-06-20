import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { ActivateOrganizationRequest } from '../../../core/models/api/requests/organization-request.request';
import { OrganizationActivationDetails } from '../../../core/models/api/responses/organization-request.response';
import { ProblemDetails } from '../../../core/models/problem-details.model';
import { OrganizationRequestsService } from '../../../core/services/api/organization-requests.service';
import { SnackbarService } from '../../../core/services/utility/snackbar.service';
import TranslationService from '../../../core/services/utility/translation.service';
import { LoaderComponent } from '../../../core/ui/loader/loader.component';

const passwordsMatchValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;

  return password === confirmPassword ? null : { passwordsMismatch: true };
};

@Component({
  selector: 'ascend-organization-setup',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    RouterLink,
    TranslateModule,
    LoaderComponent,
  ],
  templateUrl: './organization-setup.component.html',
  styleUrl: '../organization-onboarding.scss',
})
export class OrganizationSetupComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly organizationRequests = inject(OrganizationRequestsService);
  private readonly snackbar = inject(SnackbarService);
  private readonly translation = inject(TranslationService);

  private requestId?: number;
  private token = '';

  readonly loading = signal(true);
  readonly submitting = signal(false);
  readonly activation = signal<OrganizationActivationDetails | null>(null);
  readonly linkError = signal('');
  readonly formErrors = signal<string[]>([]);

  readonly form = this.fb.nonNullable.group(
    {
      password: ['', Validators.required],
      confirmPassword: ['', Validators.required],
      staffCode: [
        '',
        [
          Validators.required,
          Validators.pattern(/^\d+$/),
          Validators.minLength(3),
          Validators.maxLength(8),
        ],
      ],
    },
    { validators: passwordsMatchValidator }
  );

  ngOnInit(): void {
    const requestIdValue = this.route.snapshot.queryParamMap.get('requestId');
    const tokenValue = this.route.snapshot.queryParamMap.get('token');
    const parsedRequestId = Number(requestIdValue);

    if (
      !requestIdValue ||
      !Number.isInteger(parsedRequestId) ||
      parsedRequestId <= 0 ||
      !tokenValue
    ) {
      this.loading.set(false);
      this.linkError.set(
        this.translation.getTranslationForKey(
          'organizationOnboarding.errors.invalidLink'
        )
      );
      return;
    }

    this.requestId = parsedRequestId;
    this.token = tokenValue;
    this.loadActivation();
  }

  onSubmit(): void {
    if (this.submitting() || !this.requestId || !this.token) {
      return;
    }

    this.formErrors.set([]);
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      return;
    }

    const value = this.form.getRawValue();
    const request: ActivateOrganizationRequest = {
      token: this.token,
      password: value.password,
      confirmPassword: value.confirmPassword,
      staffCode: value.staffCode,
    };

    this.submitting.set(true);
    this.organizationRequests
      .activate(this.requestId, request)
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => {
          void this.router.navigate(['/login']).then(() => {
            this.snackbar.success(
              this.translation.getTranslationForKey(
                'organizationOnboarding.setup.success'
              )
            );
          });
        },
        error: (error: HttpErrorResponse) => this.handleActivationError(error),
      });
  }

  private loadActivation(): void {
    this.loading.set(true);
    this.organizationRequests
      .getActivation(this.requestId!, this.token)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (activation) => this.activation.set(activation),
        error: (error: HttpErrorResponse) => {
          this.linkError.set(this.getPrimaryErrorMessage(error));
        },
      });
  }

  private handleActivationError(error: HttpErrorResponse): void {
    const messages = this.getErrorMessages(error);

    if (this.isLinkFailure(error, messages)) {
      this.activation.set(null);
      this.linkError.set(messages[0]);
      return;
    }

    this.formErrors.set(messages);
  }

  private isLinkFailure(
    error: HttpErrorResponse,
    messages: string[]
  ): boolean {
    if ([401, 403, 404, 409, 410].includes(error.status)) {
      return true;
    }

    const message = messages.join(' ').toLowerCase();
    return (
      message.includes('token') ||
      message.includes('link') ||
      message.includes('expired') ||
      message.includes('already activated') ||
      message.includes('already used') ||
      message.includes('rejected')
    );
  }

  private getPrimaryErrorMessage(error: HttpErrorResponse): string {
    return this.getErrorMessages(error)[0];
  }

  private getErrorMessages(error: HttpErrorResponse): string[] {
    if (error.status === 429) {
      return [
        this.translation.getTranslationForKey(
          'organizationOnboarding.errors.tooManyAttempts'
        ),
      ];
    }

    const problem = error.error as ProblemDetails | string | null;
    if (typeof problem === 'string' && problem.trim()) {
      return [problem];
    }

    const details =
      problem && typeof problem === 'object' ? problem : undefined;
    const validationMessages = Object.values(details?.errors ?? {})
      .flat()
      .filter(Boolean);
    const messages =
      validationMessages.length > 0
        ? validationMessages
        : [
            details?.detail ??
              'organizationOnboarding.errors.activationFailed',
          ];

    return messages.map((message) =>
      this.translation.getTranslationForKey(message)
    );
  }
}

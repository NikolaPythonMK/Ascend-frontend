import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { AbstractControl, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { TranslateModule } from "@ngx-translate/core";
import TranslationService from "../../core/services/translation.service";
import { Router } from "@angular/router";
import { SnackbarService } from "../../core/services/snackbar.service";
import { HttpErrorResponse } from "@angular/common/http";
import { LoginRequest } from "../../core/models/login.request";
import { Language } from "../../core/models/language.type";
import { OrganizationService } from "../../core/services/organization.service";


@Component({
    imports: [FormsModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule, TranslateModule, CommonModule, MatIconModule],
    templateUrl: 'organization-login.component.html',
    styleUrls: ['organization-login.component.scss']
})
export class OrganizationLoginPage {
    private translationService = inject(TranslationService);
    private organizationService = inject(OrganizationService);
    private router = inject(Router)
    private snackbarService = inject(SnackbarService)

        loginForm = new FormGroup({
          username: new FormControl('', Validators.required),
          password: new FormControl('', Validators.required)
        })
        formSubmitted: boolean = false;
        errorKey?: string;
    
        getUsernameControl(): AbstractControl {
          return this.loginForm.get('username')!;
        }
    
        getPasswordControl(): AbstractControl {
          return this.loginForm.get('password')!;
        }
    
        onHandleMk(lang: Language): void {
            this.translationService.changeLanguage(lang);
        }
    
        onHandleEn(lang: Language): void {
            this.translationService.changeLanguage(lang);
        }
    
        onCloseErrorMessage(): void {
          this.errorKey = '';
        }
    
        onSubmit(): void {
          this.formSubmitted = true;
          if (this.loginForm.invalid) {
            return;
          }
    
          const loginRequest: LoginRequest = {
            username: this.getUsernameControl().value,
            password: this.getPasswordControl().value
          }
    
          const result = this.organizationService.login(loginRequest, true).subscribe({
            next: () => {
              this.snackbarService.success('Logged in successfully');
              this.router.navigate(['/login/123'])
            },
            error: (error: HttpErrorResponse) => {
              console.log(error.message);
              this.errorKey = error.message;
            }
          });
        }
}
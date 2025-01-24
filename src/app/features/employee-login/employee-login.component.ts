import { AfterViewInit, Component, ElementRef, HostListener, inject } from "@angular/core";
import { Router } from "@angular/router";
import { EmployeeStore } from "../../core/store/employee.store";
import { AbstractControl, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";

@Component({
    selector: 'ascend-employee-login',
    imports: [ReactiveFormsModule, FormsModule],
    templateUrl: 'employee-login.component.html',
    styleUrls: ['employee-login.component.scss']
})
export class EmployeeLoginComponent implements AfterViewInit{
    router = inject(Router);
    employeeStore = inject(EmployeeStore);

    elRef = inject(ElementRef);

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
        this.employeeStore.setEmployee({
            id: 1,
            code: 1234,
            permissions: [],
            language: 'mk'
        })
        this.router.navigate(['/123/tables']);
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
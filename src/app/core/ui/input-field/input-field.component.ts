import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, forwardRef, input, output, signal, ViewChild } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { TranslateModule } from "@ngx-translate/core";

@Component({
  selector: 'ascend-input-field',
  imports: [CommonModule, TranslateModule, MatFormFieldModule, ReactiveFormsModule],
  templateUrl: 'input-field.component.html',
  styleUrls: ['input-field.component.scss'],
  providers: [
    {
        provide: NG_VALUE_ACCESSOR,
        useExisting: forwardRef(() => InputFieldComponent),
        multi: true
    }
  ]
})
export class InputFieldComponent implements ControlValueAccessor, AfterViewInit {
  @ViewChild('inputElement', { static: true }) inputElement!: ElementRef<HTMLInputElement>;
  type = input<string>('text');
  autoFocus = input<boolean>(false);
  placeholder = input<string>('');
  hasError = input<boolean>(false);
  errorMessage = input<string>();

  blurEvent = output<void>();

  value = signal<string>('');
  disabled = false;

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  ngAfterViewInit(): void {
    if (this.autoFocus()) {
      setTimeout(() => this.inputElement.nativeElement.focus(), 0);
    }
  }

  writeValue(value: string): void {
    this.value.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onInputChange(event: Event): void {
    const newValue = (event.target as HTMLInputElement).value;
    this.value.set(newValue);
    this.onChange(newValue);
  }

  onBlur(): void {
    this.blurEvent.emit(); // Emit the blur event
  }
}

import { Component, DestroyRef, ElementRef, inject, input, ViewChild } from "@angular/core";
import { FormControl } from "@angular/forms";
import { MatSelectModule } from "@angular/material/select";
import { filter, debounceTime, distinctUntilChanged } from "rxjs";
import { countries } from "./countries";
import { Country } from "./country.model";
import { MatIconModule } from "@angular/material/icon";

@Component({
    selector: 'ascend-country-select',
    imports: [MatSelectModule, MatIconModule],
    templateUrl: 'country-select.component.html',
    styleUrls: ['country-select.component.scss']
})
export class CountrySelectComponent {
    hasError = input(false);
    countries: Country[] = countries;
    toggleDropdown: boolean = false;
    selectedCountry: Country = countries[0];
    @ViewChild('phoneInput', { static: false }) phoneInput!: ElementRef;
    phoneNumberControl = new FormControl('');
    countrySearchTermControl = new FormControl('');
    readonly #destroyRef = inject(DestroyRef);
  
    onChange!: (value: string) => void;
    onTouched!: () => void;
  
    ngOnInit(): void {
    //   this.selectedCountry = countries[126];
    //   this.phoneNumberControl.valueChanges
    //   .subscribe(value => {
    //     if (!value || Number(value)) {
    //       this.onChange(this.selectedCountry.dial_code + value);
    //     } else {
    //       this.phoneNumberControl.setValue(value.replace(/\D/g, ''));
    //     }
    //   });
    //   this.countrySearchTermControl.valueChanges.pipe(
    //     filter(value => value != null),
    //     debounceTime(300),
    //     distinctUntilChanged(),
    //     takeUntilDestroyed(this.#destroyRef)
    //   ).subscribe(value => {
    //     if (value.length === 0){
    //       this.countries = countries;
    //     } else {
    //       this.countries = this.countries.filter(country => country.name.toLocaleLowerCase().includes(value.toLocaleLowerCase()) || country.dial_code.includes(value))
    //     }
    //   })
    }
  
    // @HostListener('document:click', ['$event'])
    // onClickOutside(event: MouseEvent){
    //   const target = event.target as HTMLElement;
    //   if (!target.closest('.countries-list')) {
    //     this.toggleDropdown = false;
    //   }
    // }
  
    // private initCountryCodes(): void {
    //   const phoneNumberUtil = PhoneNumberUtil.getInstance();
    //   const regions: string[] = phoneNumberUtil.getSupportedRegions();
  
    //   regions.forEach((region) => {
    //     const countryCode = phoneNumberUtil.getCountryCodeForRegion(region);
    //     this.countries.push({ region, countryCode });
    //   });
    //   this.selectedCountry = this.countries[0];
    // }
  
    onToggleDropdown(): void {
      this.toggleDropdown = !this.toggleDropdown;
    }
  
    onSelectCountry(index: number) {
      this.selectedCountry = this.countries[index];
      this.onChange(this.selectedCountry.dial_code + this.phoneNumberControl.value);
      this.toggleDropdown = false;
    }
  
    onPrefixClick(): void {
      this.phoneInput.nativeElement.focus();
    }
  
    writeValue(obj: string): void {
      //this.phoneNumber = obj;
    }
    registerOnChange(fn: any): void {
      this.onChange = fn;
    }
    registerOnTouched(fn: any): void {
      this.onTouched = fn;
    }
    
    setDisabledState?(isDisabled: boolean): void {}
  
    onPhoneInputBlur() {
      this.onTouched();
    }
}
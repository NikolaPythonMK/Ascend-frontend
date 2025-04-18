import { Component, DestroyRef, ElementRef, inject, input, ViewChild } from "@angular/core";
import { FormControl } from "@angular/forms";
import { MatSelectModule } from "@angular/material/select";
import { MatIconModule } from "@angular/material/icon";
import { environment } from "../../../../environments/environment";
import TranslationService from "../../services/utility/translation.service";

@Component({
    selector: 'ascend-country-select',
    imports: [MatSelectModule, MatIconModule],
    templateUrl: 'country-select.component.html',
    styleUrls: ['country-select.component.scss']
})
export class CountrySelectComponent {
    hasError = input(false);
    isCountryListOpen = input(false);
    languages: string[] = environment.languages;
    toggleDropdown: boolean = false;
    selectedLanguage?: string;
    @ViewChild('phoneInput', { static: false }) phoneInput!: ElementRef;
    phoneNumberControl = new FormControl('');
    countrySearchTermControl = new FormControl('');
    readonly #destroyRef = inject(DestroyRef);
  
    onChange!: (value: string) => void;
    onTouched!: () => void;

    translationService = inject(TranslationService);
  
    ngOnInit(): void {
      const lang = this.translationService.getCurrentLanguage();
      if (lang) {
        this.selectedLanguage = lang;
      } else {
        this.selectedLanguage = environment.languages[0];
      }
    }
  
    onToggleDropdown(): void {
      this.toggleDropdown = !this.toggleDropdown;
    }
  
    onSelectCountry(lang: string) {
      this.selectedLanguage = lang
      this.translationService.changeLanguage(lang);
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
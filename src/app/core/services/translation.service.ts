import { inject, Injectable } from "@angular/core";
import { TranslateService } from '@ngx-translate/core';
import { Language } from "../models/language.type";

@Injectable({
    providedIn: 'root'
})
export default class TranslationService {

    private translateService = inject(TranslateService);

    changeLanguage(lang: Language): void {
        localStorage.setItem('language', lang);
        this.translateService.use(lang);
    }

    // getCurrentLanguage(): Language {

    // }

    setDefaultLanguage(): void {
        const lang = localStorage.getItem('language');
        this.translateService.setDefaultLang(lang || 'mk');
    }
}
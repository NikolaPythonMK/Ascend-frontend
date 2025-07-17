import { inject, Injectable } from "@angular/core";
import { TranslateService } from '@ngx-translate/core';

@Injectable({
    providedIn: 'root'
})
export default class TranslationService {

    private translateService = inject(TranslateService);

    changeLanguage(lang: string): void {
        localStorage.setItem('language', lang);
        this.translateService.use(lang);
    }

    getCurrentLanguage(): string | null {
        return localStorage.getItem('language');
    }

    setDefaultLanguage(): void {
        const lang = localStorage.getItem('language');
        this.translateService.setDefaultLang(lang || 'mk');
    }

    getTranslationForKey(key: string): string {
        const lang = localStorage.getItem('language');
        const translation = this.translateService.instant(key);
        
        if(translation == null || translation == undefined)
            return key

        return translation;
    }
}
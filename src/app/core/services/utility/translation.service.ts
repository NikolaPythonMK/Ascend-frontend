import { inject, Injectable } from "@angular/core";
import { TranslateService } from '@ngx-translate/core';
import { Language } from "../../models/enums/language.enum";
import { SettingsManagerService } from "./settings-manager.service";

@Injectable({
    providedIn: 'root'
})
export default class TranslationService {
    private settingsManager = inject(SettingsManagerService);
    private translateService = inject(TranslateService);

    setDefaultLanguage(language: Language): void {
        this.translateService.setDefaultLang('en');
        //this.translateService.setDefaultLang(this.getLanguageFromEnum(this.settingsManager.getLanguage()));
    }

    getTranslationForKey(key: string): string {
        const translation = this.translateService.instant(key);
        
        if(translation == null || translation == undefined)
            return key

        return translation;
    }

    private getLanguageFromEnum(value: Language): string {
        switch (value) {
        case 1:
            return "en"
        case 2:
            return "mk"
        default:
            return 'en';
        }       
    }
}
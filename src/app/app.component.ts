import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import TranslationService from './core/services/utility/translation.service';
import { SettingsManagerService } from './core/services/utility/settings-manager.service';
//TODO: console log errors and warnings
@Component({
    selector: 'app-root',
    imports: [RouterOutlet, CommonModule, TranslateModule],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss'
})
export class AppComponent {
  private translationService = inject(TranslationService);
  private settingsManager = inject(SettingsManagerService);

  constructor(){
    this.translationService.setDefaultLanguage(1);
  }
}

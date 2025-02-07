import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import TranslationService from './core/services/utility/translation.service';

@Component({
    selector: 'app-root',
    imports: [RouterOutlet, CommonModule, TranslateModule],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss'
})
export class AppComponent {
  private translationService = inject(TranslationService);

  constructor(){
    this.translationService.setDefaultLanguage();
  }
}

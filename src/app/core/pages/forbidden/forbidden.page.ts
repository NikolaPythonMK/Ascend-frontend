import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-forbidden-page',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './forbidden.page.html',
  styleUrls: ['./forbidden.page.scss'],
})
export class ForbiddenPageComponent {
  readonly title = signal('errors.forbidden-title');
  readonly message = signal('errors.forbidden-description');

  // Optional image; set a path to use an image instead of the icon
  readonly imageSrc = signal<string | null>(null);
  // e.g. this.imageSrc.set('/assets/lock-illustration.svg')
}

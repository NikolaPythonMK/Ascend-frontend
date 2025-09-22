import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-forbidden-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './forbidden.page.html',
  styleUrls: ['./forbidden.page.scss'],
})
export class ForbiddenPageComponent {
  readonly title = signal('No access');
  readonly message = signal('You don’t have permission to view this page.');

  // Optional image; set a path to use an image instead of the icon
  readonly imageSrc = signal<string | null>(null);
  // e.g. this.imageSrc.set('/assets/lock-illustration.svg')
}

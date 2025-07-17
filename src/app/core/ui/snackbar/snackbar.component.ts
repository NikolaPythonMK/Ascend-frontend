import { Component, inject } from '@angular/core';
import { MAT_SNACK_BAR_DATA, MatSnackBar, MatSnackBarRef } from '@angular/material/snack-bar';
import { SnackbarData } from './models/snackbar-data';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';

@Component({
    selector: 'app-custom-snackbar',
    imports: [MatIconModule, MatButtonModule, TranslateModule],
    templateUrl: 'snackbar.component.html',
    styleUrl: 'snackbar.component.scss'
})
export class CustomSnackbarComponent {
  public data: SnackbarData = inject(MAT_SNACK_BAR_DATA);
  private matSnackbarRef: MatSnackBarRef<CustomSnackbarComponent> = inject(MatSnackBarRef);

  dismiss(): void {
    this.matSnackbarRef.dismiss();
  }
}

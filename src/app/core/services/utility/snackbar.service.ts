import { inject, Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig, MatSnackBarHorizontalPosition, MatSnackBarVerticalPosition } from '@angular/material/snack-bar';
import { CustomSnackbarComponent } from '../../ui/snackbar/snackbar.component';
import { SnackbarData } from '../../ui/snackbar/models/snackbar-data';


@Injectable({
  providedIn: 'root',
})
export class SnackbarService {
  private snackbar = inject(MatSnackBar);

  private config: MatSnackBarConfig = {
    duration: 4000, // 4 seconds
    horizontalPosition: 'start',
    verticalPosition: 'bottom',
  };

  success(message: string): void {
    this.snackbar.openFromComponent(CustomSnackbarComponent, {
      ...this.config,
      panelClass: ['success-snackbar', 'snackbar'],
      data: { message, isSuccess: true } as SnackbarData,
    });
  }

  error(message: string): void {
    this.snackbar.openFromComponent(CustomSnackbarComponent, {
        ...this.config,
        panelClass: ['error-snackbar', 'snackbar'],
        data: { message, isSuccess: false } as SnackbarData,
    })
  }
}

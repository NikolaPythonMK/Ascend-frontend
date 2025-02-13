import { Component, inject } from "@angular/core";
import { MatDialogRef } from "@angular/material/dialog";
import { ButtonComponent } from "../button/button.component";

@Component({
    imports: [ButtonComponent],
    templateUrl: 'confirmation-dialog.component.html',
    styleUrls: ['confirmation-dialog.component.scss']
})
export class ConfirmationDialog {
    readonly dialogRef = inject(MatDialogRef<ConfirmationDialog>);

    onCancel(): void {
        this.dialogRef.close(false);
    }

    onConfirm(): void {
        this.dialogRef.close(true);
    }
}
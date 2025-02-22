import { Component, inject } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogModule, MatDialogRef } from "@angular/material/dialog";
import {  MatFormFieldModule } from "@angular/material/form-field";
import { CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatInputModule } from "@angular/material/input";
import { Product } from "../../../../core/models/api/responses/product.model";

@Component({
    imports: [MatDialogActions, MatDialogModule, MatFormFieldModule, CommonModule, FormsModule, MatInputModule, FormsModule, ReactiveFormsModule],
    templateUrl: 'quantity-dialog.component.html',
    styleUrls: ['quantity-dialog.component.scss']
})
export class QuantityDialog {
    readonly dialogRef = inject(MatDialogRef<QuantityDialog>);
    readonly product = inject<Product>(MAT_DIALOG_DATA);

    onAddToCart(): void {
        this.dialogRef.close();
    }
}
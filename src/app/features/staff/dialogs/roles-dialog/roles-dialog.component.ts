import { Component, inject } from "@angular/core";
import { AbstractControl, FormBuilder, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { ButtonComponent } from "../../../../core/ui/button/button.component";
import { TranslateModule } from "@ngx-translate/core";

interface RolesDialogData {
    name: string;
}

@Component({
    imports: [MatFormFieldModule, FormsModule, ReactiveFormsModule, MatInputModule, ButtonComponent, TranslateModule],
    templateUrl: 'roles-dialog.component.html',
    styleUrls: ['roles-dialog.component.scss']
})
export class RolesDialog {
    readonly dialogRef = inject(MatDialogRef<RolesDialog>);
    readonly data = inject<RolesDialogData | null>(MAT_DIALOG_DATA, { optional: true });
    readonly fb = inject(FormBuilder);

    roleForm = this.fb.group({
        name: [this.data?.name ?? '', Validators.required],
    })

    getName(): AbstractControl {
        return this.roleForm.get('name')!;
    }

    onSubmit(): void {
        if (this.roleForm.invalid){
            return;
        }

        this.dialogRef.close(this.getName().value.trim());
    }

    onClose(): void {
        this.dialogRef.close();
    }
}

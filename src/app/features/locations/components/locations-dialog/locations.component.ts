import { Component, inject } from "@angular/core";
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatFormFieldModule, MatLabel } from "@angular/material/form-field";
import { ButtonComponent } from "../../../../core/ui/button/button.component";
import { MatDialogRef } from "@angular/material/dialog";
import { RolesDialog } from "../../../staff/dialogs/roles-dialog/roles-dialog.component";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";

@Component({
    imports: [MatFormFieldModule, MatSelectModule, FormsModule, ReactiveFormsModule, MatInputModule, ButtonComponent ],
    templateUrl: 'locations.component.html',
    styleUrls: ['locations.component.scss']
})
export class LocationsDialog {
    readonly dialogRef = inject(MatDialogRef<LocationsDialog>);
    private readonly fb = inject(FormBuilder);
    locationForm = this.fb.group({
        name: ['', Validators.required],
        tableCounts: [0, Validators.required]
    })


    onSubmit(): void {

    }

}
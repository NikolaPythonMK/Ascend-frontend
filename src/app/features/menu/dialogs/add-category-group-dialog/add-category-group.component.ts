import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ButtonComponent } from '../../../../core/ui/button/button.component';
import { UploadImageComponent } from '../../../../core/ui/upload-img/upload-img.component';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  imports: [
    CommonModule,
    MatCardModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    UploadImageComponent,
    MatCheckboxModule,
    ButtonComponent,
  ],
  templateUrl: 'add-category-group.component.html',
  styleUrls: ['add-category-group.component.scss'],
})
export class AddCategoryGroupDialog {
    private readonly fb = inject(FormBuilder);
    readonly dialogRef = inject(MatDialogRef<AddCategoryGroupDialog>);
    categoryGroupForm = this.fb.group({
        name: ['', Validators.required],
        description: ['']
    })

    getNameControl(): AbstractControl {
        return this.categoryGroupForm.get('name')!;
    }

    getDescriptionControl(): AbstractControl {
        return this.categoryGroupForm.get('description')!;
    }

    onSubmit() {
        if (this.categoryGroupForm.valid) {
          console.log(this.categoryGroupForm.value);
        }
    }
}

import { CommonModule } from "@angular/common";
import { Component, inject, signal } from "@angular/core";
import { AbstractControl, FormArray, FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatDialogRef } from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule, MatSelectTrigger } from "@angular/material/select";
import {MatChipsModule} from '@angular/material/chips';
import {MatCardModule} from '@angular/material/card';
import { UploadImageComponent } from "../../../../core/ui/upload-img/upload-img.component";
import { Category } from "../../../../core/models/api/category.model";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { HeaderCounterComponent } from "../../../../core/ui/header-counter/header-counter.component";
import { ButtonComponent } from "../../../../core/ui/button/button.component";



@Component({
    imports: [CommonModule,
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
    ButtonComponent],
    templateUrl: 'add-category.component.html',
    styleUrls: ['add-category.component.scss']
})
export class AddCategoryDialog {
    readonly dialogRef = inject(MatDialogRef<AddCategoryDialog>);
    readonly fb = inject(FormBuilder);
    categories = signal<Category[]>([
        {
            id: 1,
            name: 'Drinks',
            description: '',
            image: null,
            organizationID: 0,
            subCategories: []
        },
        {
            id: 2,
            name: 'Sandwiches',
            description: '',
            image: null,
            organizationID: 0,
            subCategories: []
        },
        {
            id: 3,
            name: 'Salads',
            description: '',
            image: null,
            organizationID: 0,
            subCategories: []
        },
        {
            id: 4,
            name: 'Teas',
            description: '',
            image: null,
            organizationID: 0,
            subCategories: []
        }
    ]);

    categoryForm = this.fb.group({
        name: ['', Validators.required],
        description: [''],
        image: [''],
        subCategories: []
    })
    staffUser: any;

    getNameControl(): AbstractControl {
        return this.categoryForm.get('name')!;
    }

    getSubCategories(): AbstractControl {
        return this.categoryForm.get('subCategories')!;
    }

    getCategoryName(id: number): string {
        return this.categories().find(i => i.id === id)?.name ?? '';
    }

    
    onSubmit() {
        if (this.categoryForm.valid) {
          console.log(this.categoryForm.value);
        }
    }
}
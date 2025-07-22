import {
    Component,
    inject,
    OnInit,
    signal
  } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { AbstractControl, FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { ProductQuantityDialogDataModel } from '../../models/product-quantity-dialog-data.model';
import { TableItemsService } from '../../../../core/services/api/table-items.service';
import { SnackbarService } from '../../../../core/services/utility/snackbar.service';
import { HttpErrorResponse } from '@angular/common/http';
import { TableItem } from '../../../../core/models/api/responses/table-item.model';
import { TranslateModule } from "@ngx-translate/core";
import { LoaderComponent } from '../../../../core/ui/loader/loader.component';
import { finalize } from 'rxjs';
import {  MatIconModule } from '@angular/material/icon';
import { ConfirmationDialog } from '../../../../core/ui/confirmation-dialog/confirmation-dialog.component';
import { ProductQuantityDialogResponse } from '../../models/product-quantity-dialog-response';
import TranslationService from '../../../../core/services/utility/translation.service';
import { ButtonComponent } from '../../../../core/ui/button/button.component';
  
  @Component({
    selector: 'app-product-quantity',
    standalone: true,
    templateUrl: './product-quantity-dialog.component.html',
    styleUrls: ['./product-quantity-dialog.component.scss'],
    imports: [
      CommonModule,
      FormsModule,
      MatFormFieldModule,
      MatInputModule,
      MatButtonModule,
      ReactiveFormsModule,
      TranslateModule,
      LoaderComponent,
      MatIconModule,
      ButtonComponent
    ]
  })
  export class ProductQuantityComponent implements OnInit{
    readonly dialogRef = inject(MatDialogRef<ProductQuantityComponent>);
    readonly data = inject<ProductQuantityDialogDataModel>(MAT_DIALOG_DATA);
    readonly fb = inject(FormBuilder);
    readonly tableItemService = inject(TableItemsService);
    readonly snackbar = inject(SnackbarService);
    readonly dialog = inject(MatDialog);
    readonly translationService = inject(TranslationService);

    itemForm = this.fb.group({
      quantity: 1,
      note: ''
    })
    
    isLoading = signal<boolean>(false);
    quantityLabel = signal<string>(this.translationService.getTranslationForKey("tableItems.add-dialog.quantity-label"));
    noteLabel = signal<string>(this.translationService.getTranslationForKey("tableItems.add-dialog.note-label"));
    cancelLabel = signal<string>(this.translationService.getTranslationForKey("shared.cancel"));
    submitLabel = signal<string>(this.translationService.getTranslationForKey("shared.submit"));

    ngOnInit(): void {
        if(!this.data.id){
          return;
        }
        
        this.getTableitem(this.data.id);
    }

    getQuantityFormControl(): AbstractControl {
      return this.itemForm.get('quantity')!;
    }

    getNoteFormControl(): AbstractControl {
      return this.itemForm.get('note')!;
    }


    onSubmit(): void {
      const quantity = this.getQuantityFormControl().value;
      const note = this.getNoteFormControl().value;

      if (quantity < 0) 
        return;

      const result = {
        quantity,
        note
      }
    
      this.dialogRef.close({
        operation: 'CREATE/UPDATE',
        data: result
      } as ProductQuantityDialogResponse);
    }

    onDelete(): void {
      const dialogRef = this.dialog.open(ConfirmationDialog);
      dialogRef.afterClosed().subscribe(result => {
        if(!result){
          return;
        }
        this.dialogRef.close({
          operation: 'DELETE',
          data: null
        } as ProductQuantityDialogResponse);
      });
    }


    private getTableitem(id: number) {
      this.isLoading.set(true);
      this.tableItemService.getById(id).pipe(
        finalize(() => this.isLoading.set(false))
      ).subscribe({
        next: (result: TableItem) => {
          this.getQuantityFormControl().setValue(result.quantity);
          this.getNoteFormControl().setValue(result.note);
          this.quantityLabel.set(this.translationService.getTranslationForKey("tableItems.update-dialog.quantity-label"))
          this.noteLabel.set(this.translationService.getTranslationForKey("tableItems.update-dialog.note-label"))
        },
        error: (error: HttpErrorResponse) => {
          this.snackbar.error(error.message);
        }
      })    
    }
  }
  
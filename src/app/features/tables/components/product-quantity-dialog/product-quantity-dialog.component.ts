import {
    Component,
    ViewChild,
    ElementRef,
    AfterViewInit,
    inject
  } from '@angular/core';
  import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
  import { FormsModule } from '@angular/forms';
  import { MatFormFieldModule } from '@angular/material/form-field';
  import { MatInputModule } from '@angular/material/input';
  import { MatButtonModule } from '@angular/material/button';
  import { CommonModule } from '@angular/common';
import { ProductQuantityDialogDataModel } from '../../models/product-quantity-dialog-data.model';
  
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
      MatButtonModule
    ]
  })
  export class ProductQuantityComponent implements AfterViewInit {
    quantity: number | null = null;
    @ViewChild('qtyInput') qtyInput!: ElementRef<HTMLInputElement>;
    @ViewChild('noteInput') noteInput!: ElementRef<HTMLInputElement>;

    readonly dialogRef = inject(MatDialogRef<ProductQuantityComponent>);
    readonly data = inject<ProductQuantityDialogDataModel>(MAT_DIALOG_DATA);

    ngAfterViewInit(): void {
      setTimeout(() => this.qtyInput.nativeElement.focus(), 0);
    }
  
    submit(): void {
      let q = this.quantity;
      if (!q || q <= 0) {
        q = 1;
      }
    
      const result = {
        quantity: q,
        note: this.noteInput
      };
    
      this.dialogRef.close(result);
    }
  }
  
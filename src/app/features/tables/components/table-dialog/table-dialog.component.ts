import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Product } from '../../models/product-item.model';
import { OrderedItemsComponent } from '../ordered-items/ordered-items.component';
import { SearchBarComponent } from '../../../../core/ui/search-bar/search-bar.component';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { TableItemsService } from '../../../../core/services/api/table-items.service';
import { HttpErrorResponse } from '@angular/common/http';
import { ProductsService } from '../../../../core/services/api/products.service';
import { DisplayProductsComponent } from '../display-products/display-products.component';
import { QuantityDialog } from '../quantity-dialog/quantity-dialog.component';
import { TableItem } from '../../../../core/models/api/responses/table-item.model';
import { Table } from '../../../../core/models/api/responses/table.model';


@Component({
  selector: 'table-dialog',
  imports: [CommonModule, MatIconModule, OrderedItemsComponent, SearchBarComponent, DisplayProductsComponent],
  templateUrl: 'table-dialog.component.html',
  styleUrls: ['table-dialog.component.scss'],
  // host: {
  //   '(window:keydown)': 'handleKeyDown($event)'
  // }
})
export class TableDialogComponent implements OnInit {
  readonly dialogRef = inject(MatDialogRef<TableDialogComponent>);
  readonly table = inject<Table>(MAT_DIALOG_DATA);
  readonly tableItemsService = inject(TableItemsService);
  readonly productsService = inject(ProductsService);

  readonly dialog = inject(MatDialog);

  tableItems = signal<TableItem[]>([])


  ngOnInit(): void {
    this.tableItemsService.getTableItems(this.table.id).subscribe({
      next: (tableItems: TableItem[]) => {
        this.tableItems.set(tableItems);
      },
      error: (error: HttpErrorResponse) => {
        console.log(error);
      }
    })  
  }

  onActiveProduct(product: Product): void {
    const dialogRef = this.dialog.open(QuantityDialog, {
      data: product
    })
  }
}

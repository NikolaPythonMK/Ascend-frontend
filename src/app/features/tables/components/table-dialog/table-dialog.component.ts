import { CommonModule } from '@angular/common';
import { Component, computed, HostListener, OnInit, signal } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatIcon, MatIconModule } from '@angular/material/icon';
import { Product } from '../../models/product-item.model';
import { Order } from '../../models/order.model';
import { OrderedItemsComponent } from '../ordered-items/ordered-items.component';
import { SearchBarComponent } from '../../../../core/ui/search-bar/search-bar.component';

const PRODUCTS: Product[] = [
  { id: 1, name: 'Туна сендвич', code: '3243', price: 120 },
  { id: 2, name: 'Пица сендвич', code: '6443', price: 120 },
  { id: 3, name: 'Фанта', code: '1235', price: 120 },
  { id: 4, name: 'Кока кола', code: '8980', price: 120 },
  { id: 5, name: 'Нес кафе', code: '1515', price: 120 },
];

const ORDERS: Order[] = [
  {
    id: 23,
    totalPrice: 1000,
    paymentMethod: 'cash',
    dateTime: new Date(),
    stuffId: 1,
    table: '2',
    status: 1,
    orderItems: [
      { id: 1, orderId: 23, product: { id: 1, name: 'Туна сендвич', code: '3243', price: 120 }, quantity: 2, price: 100 },
      { id: 2, orderId: 23, product: { id: 1, name: 'Фанта', code: '1443', price: 120 }, quantity: 1, price: 100 },
      { id: 3, orderId: 23, product: { id: 1, name: 'Нес кафе', code: '1515', price: 120 }, quantity: 3, price: 100 },
    ],
  },
  {
    id: 2,
    totalPrice: 2500,
    paymentMethod: 'cash',
    dateTime: new Date(),
    stuffId: 1,
    table: '2',
    status: 1,
    orderItems: [
      { id: 1, orderId: 2, product: { id: 1, name: 'Кока кола', code: '3003', price: 120 }, quantity: 1, price: 100 },
      { id: 2, orderId: 2, product: { id: 1, name: 'Пица сендвич', code: '1212', price: 120 }, quantity: 2, price: 100 },
      { id: 3, orderId: 2, product: { id: 1, name: 'Туна сендвич', code: '3243', price: 120 }, quantity: 1, price: 100 },
    ],
  },
  {
    id: 15,
    totalPrice: 4325,
    paymentMethod: 'card',
    dateTime: new Date(),
    stuffId: 1,
    table: '2',
    status: 1,
    orderItems: [
      { id: 1, orderId: 15, product: { id: 1, name: 'Нес кафе', code: '1515', price: 120 }, quantity: 2, price: 100 },
      { id: 2, orderId: 15, product: { id: 1, name: 'Нес кафе', code: '1515', price: 120 }, quantity: 1, price: 100 },
      { id: 3, orderId: 15, product: { id: 1, name: 'Туна сендвич', code: '3243', price: 120 }, quantity: 1, price: 100 },
    ],
  },
];

@Component({
  selector: 'table-dialog',
  imports: [CommonModule, MatIconModule, OrderedItemsComponent, SearchBarComponent],
  templateUrl: 'table-dialog.component.html',
  styleUrls: ['table-dialog.component.scss'],
  // host: {
  //   '(window:keydown)': 'handleKeyDown($event)'
  // }
})
export class TableDialogComponent implements OnInit {
  orders = signal(ORDERS);
  selectedOrderId = signal<number | null>(null);
  selectedOrder = computed<Order | undefined>(() => this.orders().find(i => i.id === this.selectedOrderId()));

  ngOnInit(): void {
   this.selectedOrderId.set(this.orders()[0].id);
  }

  /**
   * 
   * A better approach is to limit the scope of the keydown listener to the component's container or a specific element instead of the global window.
   *  For example, you could bind the listener to a wrapper element using the @HostListener on that element.
      Alternatively, Angular's Renderer2 service can be used for attaching and detaching event listeners dynamically, making it more performant and clean
   */
  //@HostListener('window:keydown', ['$event']) // 1) Is this bad for performance 2) Is there a better way to write this ?
  handleKeyDown(event: KeyboardEvent) {
    const currentOrderIdex = this.orders().findIndex(i => i.id === this.selectedOrderId());
    const lastOrderIndex = this.orders().length - 1;
    if (event.key === 'ArrowDown') {
      if (currentOrderIdex < lastOrderIndex) {
        this.selectedOrderId.set(this.orders()[currentOrderIdex + 1].id);
      } else {
        this.selectedOrderId.set(this.orders()[0].id);
      }
    } else if (event.key === 'ArrowUp') {
      if (currentOrderIdex > 0) {
        this.selectedOrderId.set(this.orders()[currentOrderIdex - 1].id);
      } else {
        this.selectedOrderId.set(this.orders()[lastOrderIndex].id);
      }
    }
  }

  handleOrderClick(orderId: number): void {
    this.selectedOrderId.set(orderId);
  }
}

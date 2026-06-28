import Konva from 'konva';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  linkedSignal,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { Floor, ShapeItem } from '../../models/drag-view.model';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Table } from '../../../../core/models/api/responses/table.model';
import { NgxColorsModule } from 'ngx-colors';
import { ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LocationService } from '../../../../core/services/api/locations.service';
import { LocationTablesRequest } from '../../../../core/models/api/requests/location-tables.request';
import { SnackbarService } from '../../../../core/services/utility/snackbar.service';
import { HttpErrorResponse } from '@angular/common/http';
import { Location } from '../../../../core/models/api/responses/location.model';
import { catchError, finalize, map, Observable, of } from 'rxjs';
import { LoaderComponent } from "../../../../core/ui/loader/loader.component";
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { BreakpointService } from '../../../../core/services/utility/breakpoint.service';
import { DisplayTablesHeaderComponent } from "../display-tables-header/display-tables-header.component";
import { TranslateModule } from '@ngx-translate/core';
import { PermissionService } from '../../../../core/services/auth/permission.service';
import { LocationTableMappings } from '../../../../core/models/api/responses/table-mapping.model';
import TranslationService from '../../../../core/services/utility/translation.service';

@Component({
  selector: 'drag-view',
  imports: [FormsModule, 
    NgxColorsModule, 
    CommonModule, 
    LoaderComponent, 
    MatIconModule, 
    MatButtonModule, 
    DisplayTablesHeaderComponent,
    TranslateModule],
  templateUrl: './drag-view.component.html',
  styleUrl: './drag-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DragViewComponent implements OnInit {
  private readonly locationService = inject(LocationService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly translationService = inject(TranslationService);
  readonly breakpointService = inject(BreakpointService);
  private authz = inject(PermissionService);
  clickedTableId = output<number>();
  isEdit = signal<boolean>(false);
  stage!: Konva.Stage;
  transformer!: Konva.Transformer;
  dataSource = input.required<Table[]>();
  tables = linkedSignal<Table[]>(() => this.dataSource());
  layers = signal<Konva.Layer[]>([]);
  floors: Floor[] = [];
  currentFloorIndex: number = 0;
  selectedId: string | null = null;
  copiedObstacle: ShapeItem | null = null;
  color: string = '#fff';
  loader = signal<boolean>(false);

  canUpdateTableMapping = computed(() => this.authz.has({ name: '/api/location/update-table-mapping', method: 'POST' }));

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    const containerElement = document.querySelector('#container');
    this.stage = new Konva.Stage({
      container: 'container',
      width: containerElement?.clientWidth,
      height: containerElement?.clientHeight,
      draggable: true,
    });

    this.stage.on('mouseover', () => {
      this.stage.container().style.cursor = 'pointer';
    });

    this.transformer = new Konva.Transformer({
      keepRatio: false,
      flipEnabled: false,
    });

    this.loader.set(true);
    this.loadLayout()
    .pipe(finalize(() => this.loader.set(false)))
    .subscribe(result => {
      if (!result) {
        this.addFloor({
          id: '1',
          name: this.translationService.getTranslationForKey('drag-view.main-floor'),
          items: []
        });

        this.tables().forEach((table) => {
          this.addTable(table.code, table.id);
        });
      }

      this.onEditClick(false);
    });

    this.stage.on('wheel', (e) => {
      e.evt.preventDefault();

      const oldScale = this.stage.scaleX();
      const pointer = this.stage.getPointerPosition();
      const scaleBy = 1.05;

      const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;

      const mousePointTo = {
        x: (pointer!.x - this.stage.x()) / oldScale,
        y: (pointer!.y - this.stage.y()) / oldScale,
      };

      this.stage.scale({ x: newScale, y: newScale });
      this.stage.position({
        x: pointer!.x - mousePointTo.x * newScale,
        y: pointer!.y - mousePointTo.y * newScale,
      });

      this.stage.batchDraw();
    });

  let lastTouchDist = 0;
let lastTouchCenter = { x: 0, y: 0 };

this.stage.on('contentTouchstart', (e) => {
  if (e.evt.touches?.length === 2) {
    const [touch1, touch2] = e.evt.touches;

    lastTouchDist = Math.hypot(
      touch2.clientX - touch1.clientX,
      touch2.clientY - touch1.clientY
    );

    lastTouchCenter = {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2,
    };

    this.stage.draggable(false);
  }
});

this.stage.on('contentTouchmove', (e) => {
  if (e.evt.touches?.length === 2) {
    e.evt.preventDefault();

    const [touch1, touch2] = e.evt.touches;

    const newDist = Math.hypot(
      touch2.clientX - touch1.clientX,
      touch2.clientY - touch1.clientY
    );

    const newCenter = {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2,
    };

    const oldScale = this.stage.scaleX();
    const scaleBy = newDist / lastTouchDist;
    const newScale = Math.min(Math.max(oldScale * scaleBy, 0.3), 3);

    const stageRelative = {
      x: (newCenter.x - this.stage.x()) / oldScale,
      y: (newCenter.y - this.stage.y()) / oldScale,
    };

    this.stage.scale({ x: newScale, y: newScale });

    this.stage.position({
      x: newCenter.x - stageRelative.x * newScale,
      y: newCenter.y - stageRelative.y * newScale,
    });

    this.stage.batchDraw();

    lastTouchDist = newDist;
    lastTouchCenter = newCenter;
  }
});

this.stage.on('contentTouchend contentTouchcancel', () => {
  this.stage.draggable(true);
  lastTouchDist = 0;
});

  }

  addFloor(floor: Floor) {
    const newLayer = new Konva.Layer();
    this.layers.set([...this.layers(), newLayer]);
    this.floors.push(floor);
    this.stage.add(newLayer);
    newLayer.add(this.transformer);

    floor.items.forEach((item) => this.drawShape(item, newLayer));
    this.switchFloor(this.layers().length - 1);
  }

  addNewFloor(): void {
    const floorNumber = this.layers().length + 1;
    this.addFloor({
      id: floorNumber.toString(),
      name: `${this.translationService.getTranslationForKey('drag-view.floor')} ${floorNumber}`,
      items: []
    });
  }

  switchFloor(index: number) {
    if (this.selectedId && index !== this.currentFloorIndex) {
      const currentFloor = this.floors[this.currentFloorIndex];
      const targetFloor = this.floors[index];

      const itemIndex = currentFloor.items.findIndex(
        (i) => i.id === this.selectedId
      );
      if (itemIndex !== -1) {
        const [item] = currentFloor.items.splice(itemIndex, 1);
        targetFloor.items.push(item);

        const oldLayer = this.layers()[this.currentFloorIndex];
        const group = oldLayer.findOne<Konva.Group>(`#${this.selectedId}`);
        group?.destroy();
        oldLayer.draw();
        this.drawShape(item, this.layers()[index]);
      }
    }

    this.transformer.detach();
    this.transformer.remove();

    this.currentFloorIndex = index;

    this.layers.set(this.layers().map((q, i)=> q.visible(i === index)))

    const newLayer = this.layers()[this.currentFloorIndex];
    newLayer.add(this.transformer);

    if (this.selectedId) {
      const group = newLayer.findOne<Konva.Group>(`#${this.selectedId}`);
      if (group) {
        this.transformer.nodes([group]);
      } else {
        this.transformer.nodes([]);
      }
    }

    newLayer.draw();
  }

  addTable(textToShow: string, tableId: number) {
    const id = crypto.randomUUID();
    const table: ShapeItem = {
      id,
      tableId,
      x: this.stage.width() / 2,
      y: this.stage.height() / 2,
      width: 80,
      height: 80,
      fill: '#eee',
      text: textToShow,
    };
    this.floors[this.currentFloorIndex].items.push(table);
    this.drawShape(table, this.layers()[this.currentFloorIndex]);
  }

  addObstacle() {
    const id = crypto.randomUUID();
    const obstacle: ShapeItem = {
      id,
      tableId: 0,
      x: this.stage.width() / 2,
      y: this.stage.height() / 2,
      width: 120,
      height: 30,
      fill: 'gray',
    };
    this.floors[this.currentFloorIndex].items.push(obstacle);
    this.drawShape(obstacle, this.layers()[this.currentFloorIndex]);
  }

  canRemoveSelectedObstacle(): boolean {
    if (!this.selectedId) return false;

    const selectedItem = this.floors[this.currentFloorIndex]?.items.find(
      (item) => item.id === this.selectedId
    );

    return selectedItem?.tableId === 0;
  }

  removeSelectedObstacle(): void {
    if (!this.isEdit() || !this.selectedId) return;

    const floor = this.floors[this.currentFloorIndex];
    const selectedItemIndex = floor.items.findIndex(
      (item) => item.id === this.selectedId
    );

    if (selectedItemIndex === -1) return;

    const selectedItem = floor.items[selectedItemIndex];

    if (selectedItem.tableId !== 0) return;

    floor.items.splice(selectedItemIndex, 1);

    const layer = this.layers()[this.currentFloorIndex];
    const group = layer.findOne<Konva.Group>(`#${selectedItem.id}`);
    group?.destroy();

    this.transformer.nodes([]);
    this.selectedId = null;
    layer.draw();
    this.cdr.detectChanges();
  }

  canCopySelectedObstacle(): boolean {
    return this.canRemoveSelectedObstacle();
  }

  copySelectedObstacle(): void {
    if (!this.isEdit() || !this.selectedId) return;

    const selectedItem = this.floors[this.currentFloorIndex]?.items.find(
      (item) => item.id === this.selectedId
    );

    if (!selectedItem || selectedItem.tableId !== 0) return;

    this.copiedObstacle = { ...selectedItem };
  }

  canPasteObstacle(): boolean {
    return this.isEdit() && this.copiedObstacle !== null;
  }

  pasteObstacle(): void {
    if (!this.canPasteObstacle() || !this.copiedObstacle) return;

    const pastedObstacle: ShapeItem = {
      ...this.copiedObstacle,
      id: crypto.randomUUID(),
      tableId: 0,
      x: this.copiedObstacle.x + 20,
      y: this.copiedObstacle.y + 20,
    };

    this.floors[this.currentFloorIndex].items.push(pastedObstacle);
    this.drawShape(pastedObstacle, this.layers()[this.currentFloorIndex]);

    this.selectedId = pastedObstacle.id;
    this.color = pastedObstacle.fill;

    const layer = this.layers()[this.currentFloorIndex];
    const group = layer.findOne<Konva.Group>(`#${pastedObstacle.id}`);

    if (group) {
      this.transformer.nodes([group]);
      layer.batchDraw();
    }

    this.cdr.detectChanges();
  }

  drawShape(item: ShapeItem, layer: Konva.Layer) {
    const group = new Konva.Group({
      x: item.x,
      y: item.y,
      rotation: item.rotation || 0,
      draggable: true,
      id: item.id,
    });

    let shape: Konva.Shape;

    switch (item.shapeType) {
      case 'circle':
        shape = new Konva.Circle({
          radius: item.width / 2,
          fill: item.fill,
          x: item.width / 2,
          y: item.height / 2,
        });
        break;
      case 'oval':
        shape = new Konva.Ellipse({
          radiusX: item.width / 2,
          radiusY: item.height / 2,
          fill: item.fill,
          x: item.width / 2,
          y: item.height / 2,
        });
        break;
      default:
        shape = new Konva.Rect({
          width: item.width,
          height: item.height,
          fill: item.fill,
        });
        break;
    }

    group.add(shape);

    if (item.text) {
      const textNode = new Konva.Text({
        text: item.text,
        fontSize: Math.min(item.width, item.height) / 4,
        fontFamily: 'Calibri',
        fill: '#000',
        width: item.width,
        height: item.height,
        align: 'center',
        verticalAlign: 'middle',
        listening: false,
      });

      textNode.offset({ x: item.width / 2, y: item.height / 2 });
      textNode.position({ x: item.width / 2, y: item.height / 2 });

      group.add(textNode);
    }

    layer.add(group);

    const selectShape = (e: any) => {
      console.log(item);
      if (!this.isEdit()) {
        if(item.tableId !== 0){
          this.clickedTableId.emit(item.tableId);
        }
      } else {
        e.cancelBubble = true;
        this.selectedId = item.id;
        this.color = item.fill;
        this.transformer.nodes([group]);
        layer.batchDraw();
        this.cdr.detectChanges();
      }
    };

    group.on('click', selectShape);  
    group.on('touchstart', selectShape); 


    group.on('transformend', () => {
      const item = this.floors[this.currentFloorIndex].items.find(
        (i) => i.id === group.id()
      );
      if (item) {
        item.width *= group.scaleX();
        item.height *= group.scaleY();
        item.rotation = group.rotation();
      }
    });

    group.on('dragend', () => {
      const item = this.floors[this.currentFloorIndex].items.find(
        (i) => i.id === group.id()
      );
      if (item) {
        item.x = group.x();
        item.y = group.y();
      }
    });

    this.stage.on('click', (e: any) => {
      if (e.target === this.stage) {
        this.transformer.nodes([]);
        layer.batchDraw();
        this.selectedId = null;
        this.cdr.detectChanges();
      }
    });

    layer.draw();
  }

  changeShapeColor(event: any, id: string | null) {
    if (!id) return;

    const item = this.floors[this.currentFloorIndex].items.find(
      (i) => i.id === id
    );
    if (!item) return;

    const layer = this.layers()[this.currentFloorIndex];
    const group = layer.findOne<Konva.Group>(`#${id}`);
    if (!group) return;

    const shape = group.findOne<Konva.Shape>('Shape');
    if (shape) {
      shape.fill(event);
      layer.draw();
    }

    item.fill = event;
  }

  switchShapeType(id: string | null, newType: 'rect' | 'circle' | 'oval') {
    if (!id) return;

    const item = this.floors[this.currentFloorIndex].items.find(
      (i) => i.id === id
    );
    if (!item) return;

    item.shapeType = newType;

    const layer = this.layers()[this.currentFloorIndex];
    const group = layer.findOne<Konva.Group>(`#${id}`);
    if (!group) return;

    const currentX = group.x();
    const currentY = group.y();
    const currentWidth = item.width;
    const currentHeight = item.height;

    group.destroy();

    item.x = currentX;
    item.y = currentY;
    item.width = currentWidth;
    item.height = currentHeight;

    this.drawShape(item, layer);
    layer.draw();
  }

  zoom(step: number) {
    const oldScale = this.stage.scaleX();
    const newScale = Math.max(0.1, Math.min(oldScale + step, 10));
    const container = this.stage.container();

    const pointer = {
      x: container.offsetWidth / 2,
      y: container.offsetHeight / 2,
    };

    const stagePointer = {
      x: (pointer.x - this.stage.x()) / oldScale,
      y: (pointer.y - this.stage.y()) / oldScale,
    };

    this.stage.scale({ x: newScale, y: newScale });
    this.stage.position({
      x: pointer.x - stagePointer.x * newScale,
      y: pointer.y - stagePointer.y * newScale,
    });
    this.stage.batchDraw();
  }

  zoomIn() {
    this.zoom(0.5);
  }

  zoomOut() {
    this.zoom(-0.5);
  }

  onEditClick(param: boolean = true){
    if(param){
      this.isEdit.set(!this.isEdit());
    }
    
    // Add a small delay to allow DOM to update, then resize canvas
    setTimeout(() => {
      this.resizeCanvas();
    }, 100);
    
     if (!this.isEdit()) {
      this.transformer.nodes([]);
      this.transformer.enabledAnchors([]);
      this.layers().forEach(layer => {
        layer.find('Group').forEach(shape => {
          shape.draggable(false);
        });
        layer.draw();
      });
    } else {
      this.transformer.enabledAnchors([
        'top-left', 'top-right',
        'bottom-left', 'bottom-right',
        'top-center', 'bottom-center',
        'middle-left', 'middle-right'
      ]);
      this.layers().forEach(layer => {
      layer.find('Group').forEach(shape => {
          shape.draggable(true);
        });
        layer.draw();
      });
    }
  }

  private resizeCanvas() {
    const containerElement = document.querySelector('#container') as HTMLElement;
    if (containerElement && this.stage) {
      const newWidth = containerElement.clientWidth;
      const newHeight = containerElement.clientHeight;
      
      this.stage.size({
        width: newWidth,
        height: newHeight,
      });
      
      this.stage.batchDraw();
    }
  }

  saveLayout() {
    const request: LocationTablesRequest = {
      id: Number(localStorage.getItem('location')),
      tableLocationMapping: JSON.stringify(this.floors),
    };

    this.loader.set(true);
    this.locationService.updateTableMapping(request)
    .pipe(
      finalize(() => this.loader.set(false))
    )
    .subscribe({
      next: () => {
        this.snackbarService.success(
          this.translationService.getTranslationForKey('shared.successfully')
        );
      },
      error: (error: HttpErrorResponse) => {
        this.snackbarService.error(error.message);
      },
    });
  }

  loadLayout(): Observable<boolean> {
    const locationId = Number(localStorage.getItem('location'));

    if (!locationId) return of(false);

    return this.locationService.getTableMapping(locationId).pipe(
      map((location: string) => {
        const raw = location;

        if (!raw) return false;

        if (raw == '')
          return false;

        const savedFloors: Floor[] = JSON.parse(raw);

        this.layers.set(this.layers().map(q => q.destroy()));
        this.layers.set([]);
        this.floors = [];

        savedFloors.forEach(floor => this.addFloor(floor));
        this.switchFloor(0);

        return true;
      }),
      catchError(err => {
        console.error('Failed to load layout:', err);
        return of(false);
      })
    );
  }

  onCanvasEditButtonClick(): void {
    this.isEdit.set(true);
    this.onEditClick(false);
  }

  onCancel(): void {
    this.isEdit.set(false);
    this.onEditClick(false);
  }
}

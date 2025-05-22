import Konva from 'konva';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  linkedSignal,
  OnInit,
} from '@angular/core';
import { Floor, ShapeItem } from '../../models/drag-view.model';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Table } from '../../../../core/models/api/responses/table.model';
import { NgxColorsModule } from 'ngx-colors';
import { ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LocationService } from '../../../../core/services/api/locations.service';
import { LocationRequest } from '../../../../core/models/api/requests/location.request';
import { LocationTablesRequest } from '../../../../core/models/api/requests/location-tables.request';
import { SnackbarService } from '../../../../core/services/utility/snackbar.service';
import { HttpErrorResponse } from '@angular/common/http';
import { Location } from '../../../../core/models/api/responses/location.model';

@Component({
  selector: 'drag-view',
  imports: [FormsModule, NgxColorsModule, CommonModule],
  templateUrl: './drag-view.component.html',
  styleUrl: './drag-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DragViewComponent implements OnInit {
  private readonly locationService = inject(LocationService);
  private readonly snackbarService = inject(SnackbarService);
  stage!: Konva.Stage;
  transformer!: Konva.Transformer;
  dataSource = input.required<Table[]>();
  tables = linkedSignal<Table[]>(() => this.dataSource());
  layers: Konva.Layer[] = [];
  floors: Floor[] = [];
  currentFloorIndex: number = 0;
  selectedId: string | null = null;
  color: string = '#fff';

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

    if (!this.loadLayout()) {
      this.addFloor({ id: '1', name: 'Main', items: [] });

      this.tables().forEach((table) => {
        this.addTable(table.code);
      });
    }
  }

  addFloor(floor: Floor) {
    const newLayer = new Konva.Layer();
    this.layers.push(newLayer);
    this.floors.push(floor);
    this.stage.add(newLayer);
    newLayer.add(this.transformer);

    floor.items.forEach((item) => this.drawShape(item, newLayer));
    this.switchFloor(this.layers.length - 1);
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

        const oldLayer = this.layers[this.currentFloorIndex];
        const group = oldLayer.findOne<Konva.Group>(`#${this.selectedId}`);
        group?.destroy();
        oldLayer.draw();
        this.drawShape(item, this.layers[index]);
      }
    }

    this.transformer.detach();
    this.transformer.remove();

    this.currentFloorIndex = index;

    this.layers.forEach((layer, i) => {
      layer.visible(i === index);
    });

    const newLayer = this.layers[this.currentFloorIndex];
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

  addTable(textToShow?: string) {
    const id = crypto.randomUUID();
    const table: ShapeItem = {
      id,
      x: this.stage.width() / 2,
      y: this.stage.height() / 2,
      width: 80,
      height: 80,
      fill: '#eee',
      text: textToShow,
    };
    this.floors[this.currentFloorIndex].items.push(table);
    this.drawShape(table, this.layers[this.currentFloorIndex]);
  }

  addObstacle() {
    const id = crypto.randomUUID();
    const obstacle: ShapeItem = {
      id,
      x: this.stage.width() / 2,
      y: this.stage.height() / 2,
      width: 120,
      height: 30,
      fill: 'gray',
    };
    this.floors[this.currentFloorIndex].items.push(obstacle);
    this.drawShape(obstacle, this.layers[this.currentFloorIndex]);
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

    group.on('click', (e: any) => {
      e.cancelBubble = true;
      this.selectedId = item.id;
      this.color = item.fill;
      this.transformer.nodes([group]);
      layer.batchDraw();
      this.cdr.detectChanges();
    });

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

    const layer = this.layers[this.currentFloorIndex];
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
    debugger;
    if (!id) return;

    debugger;
    const item = this.floors[this.currentFloorIndex].items.find(
      (i) => i.id === id
    );
    if (!item) return;

    item.shapeType = newType;

    const layer = this.layers[this.currentFloorIndex];
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

  saveLayout() {
    const request: LocationTablesRequest = {
      id: Number(localStorage.getItem('location')),
      tableLocationMapping: JSON.stringify(this.floors),
    };

    this.locationService.updateTableMapping(request).subscribe({
      next: () => {
        this.snackbarService.success('Успешно');
      },
      error: (error: HttpErrorResponse) => {
        this.snackbarService.error(error.message);
      },
    });
  }

  loadLayout(): boolean {
    const location = Number(localStorage.getItem('location'));
    let raw = '';

    this.locationService.getById(location).subscribe({
      next: (location: Location) => {
        raw = location.tableLocationMapping!;

        const savedFloors: Floor[] = JSON.parse(raw);
        this.layers.forEach((layer) => layer.destroy());
        this.layers = [];
        this.floors = [];

        savedFloors.forEach((floor) => this.addFloor(floor));
        this.switchFloor(0);
      },
    });

    return true;
  }
}

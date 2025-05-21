export interface ShapeItem {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  rotation?: number;
  shapeType?: string;
  text?: string;
}

export interface Floor {
  id: string;
  name: string;
  items: ShapeItem[];
}
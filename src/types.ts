export type AppState = 'idle' | 'capturing' | 'active' | 'editing';

export type ToolType = 'select' | 'pencil' | 'line' | 'arrow' | 'rect' | 'marker' | 'text';

export type ColorPreset = {
  name: string;
  value: string;
};

export interface Point {
  x: number;
  y: number;
}

export interface DrawingElement {
  id: string;
  type: Exclude<ToolType, 'select'>;
  points: Point[];
  color: string;
  thickness: number;
  text?: string;
}

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type DragHandle =
  | 'tl' | 'tc' | 'tr'
  | 'ml'          | 'mr'
  | 'bl' | 'bc' | 'br'
  | 'move'
  | null;

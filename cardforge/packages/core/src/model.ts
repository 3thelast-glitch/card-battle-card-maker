export type Id = string;

export type ProjectMeta = {
  name: string;
  createdAt: string;
  updatedAt: string;
  version: string;
  filePath?: string;
};

export type Project = {
  meta: ProjectMeta;
  sets: SetModel[];
  blueprints: Blueprint[];
  items: Item[];
  dataTables: DataTable[];
};

export type SetModel = {
  id: Id;
  name: string;
  description?: string;
  color?: string;
};

export type Blueprint = {
  id: Id;
  name: string;
  description?: string;
  category?: string;
  size: { w: number; h: number };
  background?: string;
  elements: ElementModel[];
};

export type ElementType = 'text' | 'image' | 'shape' | 'icon';

export type ElementBase = {
  id: Id;
  type: ElementType;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number;
  visible: boolean;
  opacity?: number;
  zIndex: number;
  locked?: boolean;
  bindingKey?: string;
};

export type TextElement = ElementBase & {
  type: 'text';
  text: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number | string;
  fontStyle?: 'normal' | 'italic';
  fill?: string;
  align?: 'left' | 'center' | 'right';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  lineHeight?: number;
  stroke?: string;
  strokeWidth?: number;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  shadowOpacity?: number;
};

export type ImageElement = ElementBase & {
  type: 'image';
  src: string;
  fit?: 'cover' | 'contain' | 'stretch';
  radius?: number;
  stroke?: string;
  strokeWidth?: number;
};

export type ShapeElement = ElementBase & {
  type: 'shape';
  shape: 'rect';
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  radius?: number;
};

export type IconElement = ElementBase & {
  type: 'icon';
  iconName: string;
  fontSize?: number;
  fill?: string;
};

export type ElementModel = TextElement | ImageElement | ShapeElement | IconElement;

export type DataRow = {
  id: Id;
  data: Record<string, any>;
  quantity?: number;
  setId?: Id;
  blueprintId?: Id;
};

export type DataTable = {
  id: Id;
  name: string;
  setId?: Id;
  columns: string[];
  rows: DataRow[];
};

export type Item = {
  id: Id;
  name: string;
  setId: Id;
  blueprintId: Id;
  data: Record<string, any>;
  quantity: number;
  sourceRowId?: Id;
};

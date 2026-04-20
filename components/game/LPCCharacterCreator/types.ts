export interface LPCSelection {
  itemId: string;
  variant: string;
  name: string;
}

export type LPCSelections = Record<string, LPCSelection>;

export type BodyType = 'male' | 'female' | 'teen' | 'child' | 'muscular' | 'pregnant';

export interface LPCState {
  selections: LPCSelections;
  bodyType: BodyType;
}

export interface ItemMeta {
  name: string;
  type_name: string;
  required: string[];
  animations: string[];
  variants: string[];
  layers: Record<string, LayerMeta>;
  path: string[];
  matchBodyColor?: boolean;
  priority?: number;
}

export interface LayerMeta {
  zPos: number;
  male?: string;
  female?: string;
  teen?: string;
  child?: string;
  muscular?: string;
  pregnant?: string;
  custom_animation?: string;
}

export interface CategoryNode {
  items?: string[];
  children?: Record<string, CategoryNode>;
}

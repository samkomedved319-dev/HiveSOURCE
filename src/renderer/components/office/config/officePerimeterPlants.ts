import { BACK_WALL_INNER_Z } from '@/components/office/office/furniture/coffeeLoungeConstants';

const LEFT_WALL_X = -6.85 + 0.09 + 0.32;
const RIGHT_WALL_X = 7.15 - 0.09 - 0.32;
export const BACK_WALL_PLANT_Z = BACK_WALL_INNER_Z + 0.28;

export type PerimeterPlantVariant = 'small' | 'medium' | 'tall' | 'fiddle' | 'snake';

export type PerimeterPlant = {
  position: [number, number, number];
  variant: PerimeterPlantVariant;
};

export const BACK_WALL_PLANTS: PerimeterPlant[] = [
  { position: [-5.15, 0, BACK_WALL_PLANT_Z], variant: 'tall' },
  { position: [-3.65, 0, BACK_WALL_PLANT_Z], variant: 'snake' },
  { position: [3.55, 0, BACK_WALL_PLANT_Z], variant: 'small' },
  { position: [4.35, 0, BACK_WALL_PLANT_Z], variant: 'medium' },
  { position: [5.15, 0, BACK_WALL_PLANT_Z], variant: 'snake' },
  { position: [6.35, 0, BACK_WALL_PLANT_Z], variant: 'fiddle' },
];

export const PERIMETER_PLANTS: PerimeterPlant[] = [
  { position: [LEFT_WALL_X, 0, 4.15], variant: 'fiddle' },
  { position: [LEFT_WALL_X, 0, 2.35], variant: 'tall' },
  { position: [LEFT_WALL_X, 0, 0.45], variant: 'small' },
  { position: [LEFT_WALL_X, 0, -2.15], variant: 'snake' },
  ...BACK_WALL_PLANTS,
  { position: [RIGHT_WALL_X, 0, 3.35], variant: 'fiddle' },
  { position: [RIGHT_WALL_X, 0, -1.65], variant: 'snake' },
];

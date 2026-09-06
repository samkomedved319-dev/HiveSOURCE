import { Edges } from '@react-three/drei';
import { OUTLINE_COLOR } from '../materials';

export const FURNITURE_EDGE_THRESHOLD = 12;
export const FURNITURE_EDGE_THRESHOLD_SOFT = 14;
export const FURNITURE_EDGE_THRESHOLD_SHELF = 15;

export function FurnitureEdges({
  threshold = FURNITURE_EDGE_THRESHOLD,
}: {
  threshold?: number;
}) {
  return <Edges color={OUTLINE_COLOR} threshold={threshold} />;
}

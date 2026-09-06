import type { AgentDefinition } from '@/components/office/types/agent';
import { CAFE_BAR_STOOL_SEAT_Y } from '../furniture/coffeeLoungeConstants';
import { BEAN_BAG_SEAT_Y } from '../furniture/decor/SceneDecor';
import { AVATAR_SCALE } from './avatarConstants';

export type SeatStyle = 'puff' | 'chair' | 'bar-stool';

export interface SitPoseTargets {
  bodyY: number;
  bodyRotX: number;
  bodyRotZ: number;
  groupY: number;
  legHipY: number;
  thighRotX: number;
  shinRotX: number;
  legSpreadZ: number;
  legOffsetZ: number;
  armRotX: number;
  headRotX: number;
  headRotYChat: number;
}

const LEG_HIP_STAND_Y = 0.18;
const SEAT_CAP_HALF = 0.05;export function beanBagSeatTop(puffScale: number): number {
  return (BEAN_BAG_SEAT_Y + SEAT_CAP_HALF) * puffScale;
}

function buildPuffPose(puffScale: number): SitPoseTargets {
  const bodyY = -0.24;
  const legHipY = 0.1;
  const seatTop = beanBagSeatTop(puffScale);
  const groupY = seatTop - (bodyY + legHipY) * AVATAR_SCALE;

  return {
    bodyY,
    bodyRotX: -0.1,
    bodyRotZ: 0,
    groupY,
    legHipY,
    thighRotX: 1.48,
    shinRotX: -1.32,
    legSpreadZ: 0.18,
    legOffsetZ: 0.1,
    armRotX: 0.68,
    headRotX: 0.04,
    headRotYChat: 0.12,
  };
}

const CHAIR_POSE: SitPoseTargets = {
  bodyY: -0.21,
  bodyRotX: 0.08,
  bodyRotZ: 0,
  groupY: -0.05,
  legHipY: LEG_HIP_STAND_Y,
  thighRotX: 1.08,
  shinRotX: -1.08,
  legSpreadZ: 0.04,
  legOffsetZ: 0.06,
  armRotX: 0.48,
  headRotX: -0.05,
  headRotYChat: 0.1,
};

function buildBarStoolPose(): SitPoseTargets {
  const bodyY = -0.18;
  const legHipY = 0.11;
  const seatTop = CAFE_BAR_STOOL_SEAT_Y;
  const groupY = seatTop - (bodyY + legHipY) * AVATAR_SCALE;

  return {
    bodyY,
    bodyRotX: 0.04,
    bodyRotZ: 0,
    groupY,
    legHipY,
    thighRotX: 1.22,
    shinRotX: -0.95,
    legSpreadZ: 0.06,
    legOffsetZ: 0.05,
    armRotX: 0.55,
    headRotX: -0.02,
    headRotYChat: 0.1,
  };
}

export function getSeatStyle(def: AgentDefinition): SeatStyle {
  if (def.homeZone === 'wall-desks') return 'chair';
  if (def.homeZone === 'living') return 'puff';
  if (def.homeZone === 'cafeteria') return 'bar-stool';
  return 'chair';
}

export function getSitPoseTargets(style: SeatStyle, puffScale = 1): SitPoseTargets {
  if (style === 'puff') return buildPuffPose(puffScale);
  if (style === 'bar-stool') return buildBarStoolPose();
  return CHAIR_POSE;
}export function easeSitBlend(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
}

export function lerpSitValue(from: number, to: number, blend: number): number {
  return from + (to - from) * blend;
}

export { LEG_HIP_STAND_Y };

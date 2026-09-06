import { SCENE_CONFIG } from '@/components/office/config/agents.config';

export interface WalkPoseFrame {
  walkBlend: number;
  bodyBob: number;
  bodyLeanX: number;
  bodySwayZ: number;
  hipOffsetX: number;
  leftThighX: number;
  rightThighX: number;
  leftShinX: number;
  rightShinX: number;
  leftArmX: number;
  rightArmX: number;
  leftArmZ: number;
  rightArmZ: number;
  headRotY: number;
  headRotX: number;
}

export function easeWalkBlend(t: number): number {
  const x = Math.max(0, Math.min(1, t));
  return x * x * (3 - 2 * x);
}

export function getWalkPoseFrame(
  elapsedTime: number,
  phase: number,
  moveSpeed: number,
  walkBlend: number,
): WalkPoseFrame {
  const easedBlend = easeWalkBlend(walkBlend);
  const speedNorm = Math.min(1, moveSpeed / SCENE_CONFIG.walkSpeed);
  const blend = easedBlend * (0.25 + speedNorm * 0.75);

  if (blend < 0.01) {
    return {
      walkBlend: 0,
      bodyBob: 0,
      bodyLeanX: 0,
      bodySwayZ: 0,
      hipOffsetX: 0,
      leftThighX: 0,
      rightThighX: 0,
      leftShinX: 0,
      rightShinX: 0,
      leftArmX: 0,
      rightArmX: 0,
      leftArmZ: 0,
      rightArmZ: 0,
      headRotY: 0,
      headRotX: 0,
    };
  }

  const stepHz = 2.1 + speedNorm * 2.4;
  const cycle = ((elapsedTime * stepHz + phase) % 1) * Math.PI * 2;
  const sin = Math.sin(cycle);
  const cos = Math.cos(cycle);

  const legAmp = 0.58 * blend;
  const leftThighX = sin * legAmp;
  const rightThighX = -sin * legAmp;

  const leftShinX = -Math.max(0, sin) * 0.82 * blend;
  const rightShinX = -Math.max(0, -sin) * 0.82 * blend;

  const armAmp = 0.36 * blend;
  const leftArmX = -sin * armAmp - 0.04 * blend;
  const rightArmX = sin * armAmp - 0.04 * blend;
  const leftArmZ = sin * 0.06 * blend;
  const rightArmZ = -sin * 0.06 * blend;

  return {
    walkBlend: blend,
    bodyBob: Math.abs(Math.sin(cycle)) * 0.036 * blend,
    bodyLeanX: -0.028 * blend + sin * 0.035 * blend,
    bodySwayZ: cos * 0.03 * blend,
    hipOffsetX: cos * 0.014 * blend,
    leftThighX,
    rightThighX,
    leftShinX,
    rightShinX,
    leftArmX,
    rightArmX,
    leftArmZ,
    rightArmZ,
    headRotY: cos * 0.022 * blend,
    headRotX: -0.018 * blend - Math.abs(Math.sin(cycle)) * 0.012 * blend,
  };
}

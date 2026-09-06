export interface CoffeeArmPose {
  rotX: number;
  rotY: number;
  rotZ: number;
}

export interface CoffeePoseFrame {
  rightArm: CoffeeArmPose;
  leftArm: CoffeeArmPose;
  bodyRotX: number;
  headRotX: number;
  headRotY: number;
  headRotZ: number;
}

export function getCoffeePoseFrame(elapsed: number, phase: number): CoffeePoseFrame {
  const t = elapsed + phase;
  const breathe = Math.sin(t * 1.55) * 0.045;
  const blow = Math.max(0, Math.sin(t * 0.9 + 0.35)) ** 2;
  const cradle = 0.82 + breathe;

  return {
    rightArm: {
      rotX: -cradle - blow * 0.2,
      rotY: 0.2 + blow * 0.08,
      rotZ: 0.42 + breathe * 0.06,
    },
    leftArm: {
      rotX: -cradle * 0.88 - blow * 0.14,
      rotY: -0.16 - blow * 0.05,
      rotZ: -0.36 - breathe * 0.05,
    },
    bodyRotX: 0.04 + blow * 0.04,
    headRotX: 0.12 + blow * 0.15,
    headRotY: 0.08 + blow * 0.05,
    headRotZ: blow * 0.03,
  };
}

export function easeCoffeeBlend(value: number): number {
  const clamped = Math.max(0, Math.min(1, value));
  return clamped * clamped * (3 - 2 * clamped);
}

export function lerpCoffeeValue(from: number, to: number, blend: number): number {
  return from + (to - from) * blend;
}
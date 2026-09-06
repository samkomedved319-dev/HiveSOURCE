import type { AvatarDesignId } from '@/components/office/types/avatarDesign';

export interface HairStrandSpec {
  pos: [number, number, number];
  rot: [number, number, number];
  length: number;
  radius: number;
}

const BOB_MARLEY_DREADS: HairStrandSpec[] = [
  { pos: [-0.09, 0.1, 0.04], rot: [0.18, 0.16, 0.24], length: 0.22, radius: 0.013 },
  { pos: [-0.07, 0.11, 0.05], rot: [0.24, 0.1, 0.16], length: 0.24, radius: 0.012 },
  { pos: [-0.05, 0.115, 0.06], rot: [0.28, 0.06, 0.1], length: 0.26, radius: 0.012 },
  { pos: [-0.025, 0.118, 0.065], rot: [0.32, 0.02, 0.05], length: 0.28, radius: 0.012 },
  { pos: [0.025, 0.118, 0.065], rot: [0.32, -0.02, -0.05], length: 0.28, radius: 0.012 },
  { pos: [0.05, 0.115, 0.06], rot: [0.28, -0.06, -0.1], length: 0.26, radius: 0.012 },
  { pos: [0.07, 0.11, 0.05], rot: [0.24, -0.1, -0.16], length: 0.24, radius: 0.012 },
  { pos: [0.09, 0.1, 0.04], rot: [0.18, -0.16, -0.24], length: 0.22, radius: 0.013 },
  { pos: [-0.11, 0.06, 0.02], rot: [0.12, 0.38, 0.45], length: 0.28, radius: 0.012 },
  { pos: [0.11, 0.06, 0.02], rot: [0.12, -0.38, -0.45], length: 0.28, radius: 0.012 },
  { pos: [-0.1, 0.04, -0.02], rot: [0.1, 0.42, 0.5], length: 0.3, radius: 0.012 },
  { pos: [0.1, 0.04, -0.02], rot: [0.1, -0.42, -0.5], length: 0.3, radius: 0.012 },
  { pos: [-0.08, 0.05, -0.08], rot: [0.58, 0.2, 0.12], length: 0.34, radius: 0.012 },
  { pos: [0.08, 0.05, -0.08], rot: [0.58, -0.2, -0.12], length: 0.34, radius: 0.012 },
  { pos: [-0.06, 0.055, -0.11], rot: [0.68, 0.14, 0.08], length: 0.36, radius: 0.011 },
  { pos: [0.06, 0.055, -0.11], rot: [0.68, -0.14, -0.08], length: 0.36, radius: 0.011 },
  { pos: [-0.04, 0.06, -0.13], rot: [0.78, 0.1, 0.05], length: 0.38, radius: 0.011 },
  { pos: [0.04, 0.06, -0.13], rot: [0.78, -0.1, -0.05], length: 0.38, radius: 0.011 },
  { pos: [-0.02, 0.065, -0.14], rot: [0.84, 0.05, 0.02], length: 0.4, radius: 0.011 },
  { pos: [0.02, 0.065, -0.14], rot: [0.84, -0.05, -0.02], length: 0.4, radius: 0.011 },
  { pos: [0, 0.07, -0.15], rot: [0.88, 0, 0], length: 0.42, radius: 0.013 },
  { pos: [-0.12, 0.02, 0.01], rot: [0.06, 0.52, 0.58], length: 0.26, radius: 0.011 },
  { pos: [0.12, 0.02, 0.01], rot: [0.06, -0.52, -0.58], length: 0.26, radius: 0.011 },
  { pos: [-0.115, 0.03, -0.05], rot: [0.22, 0.48, 0.52], length: 0.32, radius: 0.011 },
  { pos: [0.115, 0.03, -0.05], rot: [0.22, -0.48, -0.52], length: 0.32, radius: 0.011 },
  { pos: [-0.01, 0.09, 0.07], rot: [0.35, 0, 0.02], length: 0.25, radius: 0.011 },
  { pos: [0.01, 0.09, 0.07], rot: [0.35, 0, -0.02], length: 0.25, radius: 0.011 },
];

const MJ_HAIR: HairStrandSpec[] = [
  { pos: [-0.11, 0.04, 0.05], rot: [0.08, 0.42, 0.55], length: 0.14, radius: 0.011 },
  { pos: [-0.1, 0.02, 0.03], rot: [0.12, 0.38, 0.48], length: 0.16, radius: 0.01 },
  { pos: [-0.105, 0, 0.01], rot: [0.15, 0.35, 0.42], length: 0.15, radius: 0.01 },
  { pos: [0.11, 0.04, 0.05], rot: [0.08, -0.42, -0.55], length: 0.14, radius: 0.011 },
  { pos: [0.1, 0.02, 0.03], rot: [0.12, -0.38, -0.48], length: 0.16, radius: 0.01 },
  { pos: [0.105, 0, 0.01], rot: [0.15, -0.35, -0.42], length: 0.15, radius: 0.01 },
  { pos: [-0.05, 0.1, -0.05], rot: [0.2, 0.12, 0.1], length: 0.07, radius: 0.009 },
  { pos: [0.05, 0.1, -0.05], rot: [0.2, -0.12, -0.1], length: 0.07, radius: 0.009 },
  { pos: [0, 0.105, -0.06], rot: [0.22, 0, 0], length: 0.075, radius: 0.009 },
  { pos: [-0.03, 0.08, -0.04], rot: [0.25, 0.08, 0.12], length: 0.08, radius: 0.009 },
  { pos: [0.03, 0.08, -0.04], rot: [0.25, -0.08, -0.12], length: 0.08, radius: 0.009 },
];

const FREDDIE_HAIR: HairStrandSpec[] = [
  { pos: [-0.05, 0.08, -0.08], rot: [0.35, 0.12, 0.06], length: 0.08, radius: 0.01 },
  { pos: [0.05, 0.08, -0.08], rot: [0.35, -0.12, -0.06], length: 0.08, radius: 0.01 },
  { pos: [0, 0.09, -0.09], rot: [0.42, 0, 0], length: 0.085, radius: 0.01 },
  { pos: [-0.02, 0.085, -0.1], rot: [0.48, 0.06, 0.03], length: 0.09, radius: 0.009 },
  { pos: [0.02, 0.085, -0.1], rot: [0.48, -0.06, -0.03], length: 0.09, radius: 0.009 },
];

const SHAKIRA_WAVES: HairStrandSpec[] = [
  { pos: [-0.1, 0.09, 0.03], rot: [0.16, 0.32, 0.38], length: 0.22, radius: 0.011 },
  { pos: [-0.085, 0.1, 0.045], rot: [0.2, 0.24, 0.28], length: 0.24, radius: 0.011 },
  { pos: [-0.07, 0.105, 0.055], rot: [0.24, 0.16, 0.2], length: 0.26, radius: 0.01 },
  { pos: [-0.05, 0.11, 0.06], rot: [0.28, 0.1, 0.14], length: 0.27, radius: 0.01 },
  { pos: [-0.03, 0.112, 0.065], rot: [0.3, 0.05, 0.08], length: 0.28, radius: 0.01 },
  { pos: [0.03, 0.112, 0.065], rot: [0.3, -0.05, -0.08], length: 0.28, radius: 0.01 },
  { pos: [0.05, 0.11, 0.06], rot: [0.28, -0.1, -0.14], length: 0.27, radius: 0.01 },
  { pos: [0.07, 0.105, 0.055], rot: [0.24, -0.16, -0.2], length: 0.26, radius: 0.01 },
  { pos: [0.085, 0.1, 0.045], rot: [0.2, -0.24, -0.28], length: 0.24, radius: 0.011 },
  { pos: [0.1, 0.09, 0.03], rot: [0.16, -0.32, -0.38], length: 0.22, radius: 0.011 },
  { pos: [-0.095, 0.05, -0.02], rot: [0.1, 0.4, 0.48], length: 0.28, radius: 0.01 },
  { pos: [0.095, 0.05, -0.02], rot: [0.1, -0.4, -0.48], length: 0.28, radius: 0.01 },
  { pos: [-0.085, 0.045, -0.05], rot: [0.14, 0.38, 0.44], length: 0.3, radius: 0.01 },
  { pos: [0.085, 0.045, -0.05], rot: [0.14, -0.38, -0.44], length: 0.3, radius: 0.01 },
  { pos: [-0.07, 0.05, -0.09], rot: [0.48, 0.24, 0.2], length: 0.32, radius: 0.011 },
  { pos: [0.07, 0.05, -0.09], rot: [0.48, -0.24, -0.2], length: 0.32, radius: 0.011 },
  { pos: [-0.055, 0.055, -0.11], rot: [0.58, 0.18, 0.14], length: 0.34, radius: 0.011 },
  { pos: [0.055, 0.055, -0.11], rot: [0.58, -0.18, -0.14], length: 0.34, radius: 0.011 },
  { pos: [-0.035, 0.06, -0.12], rot: [0.65, 0.12, 0.1], length: 0.35, radius: 0.01 },
  { pos: [0.035, 0.06, -0.12], rot: [0.65, -0.12, -0.1], length: 0.35, radius: 0.01 },
  { pos: [-0.018, 0.065, -0.13], rot: [0.72, 0.06, 0.05], length: 0.36, radius: 0.01 },
  { pos: [0.018, 0.065, -0.13], rot: [0.72, -0.06, -0.05], length: 0.36, radius: 0.01 },
  { pos: [0, 0.07, -0.14], rot: [0.78, 0, 0], length: 0.38, radius: 0.011 },
  { pos: [-0.08, 0.08, 0.01], rot: [0.22, 0.28, 0.32], length: 0.2, radius: 0.01 },
  { pos: [0.08, 0.08, 0.01], rot: [0.22, -0.28, -0.32], length: 0.2, radius: 0.01 },
  { pos: [-0.06, 0.03, -0.07], rot: [0.35, 0.3, 0.35], length: 0.26, radius: 0.01 },
  { pos: [0.06, 0.03, -0.07], rot: [0.35, -0.3, -0.35], length: 0.26, radius: 0.01 },
];

export const AVATAR_HAIR_LAYOUTS: Record<AvatarDesignId, HairStrandSpec[]> = {
  'bob-marley': BOB_MARLEY_DREADS,
  'michael-jackson': MJ_HAIR,
  'freddie-mercury': FREDDIE_HAIR,
  shakira: SHAKIRA_WAVES,
};

export const AVATAR_HAIR_CAP: Partial<Record<AvatarDesignId, [number, number, number]>> = {
  'bob-marley': [0.24, 0.04, 0.19],
  shakira: [0.24, 0.038, 0.19],
};

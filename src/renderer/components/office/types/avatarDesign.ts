export type AvatarDesignId =
  | 'bob-marley'
  | 'michael-jackson'
  | 'freddie-mercury'
  | 'shakira';

export type AvatarHairStyle = 'dreads-long' | 'dreads-short' | 'slick-back' | 'wavy-long';

export interface AvatarDesign {
  id: AvatarDesignId;
  chassisColor: string;
  accentColor: string;
  trimColor: string;
  hairColor: string;
  skinColor: string;
  pantsColor: string;
  shoeColor: string;
  hairStyle: AvatarHairStyle;
}

export const AVATAR_DESIGN_IDS: AvatarDesignId[] = [
  'bob-marley',
  'michael-jackson',
  'freddie-mercury',
  'shakira',
];

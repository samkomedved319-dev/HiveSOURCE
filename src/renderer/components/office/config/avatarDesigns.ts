import type { AgentDefinition } from '@/components/office/types/agent';
import type { AvatarDesign, AvatarDesignId } from '@/components/office/types/avatarDesign';
import type { TranslationKey } from '@/components/office/stubs/i18nTypes';

export const AVATAR_DESIGNS: Record<AvatarDesignId, AvatarDesign> = {
  'bob-marley': {
    id: 'bob-marley',
    chassisColor: '#3d6b4a',
    accentColor: '#c9a227',
    trimColor: '#b83232',
    hairColor: '#141010',
    skinColor: '#8d6848',
    pantsColor: '#3a3228',
    shoeColor: '#2a241c',
    hairStyle: 'dreads-long',
  },
  'michael-jackson': {
    id: 'michael-jackson',
    chassisColor: '#1c1c24',
    accentColor: '#e8e4dc',
    trimColor: '#a82020',
    hairColor: '#121218',
    skinColor: '#c8a882',
    pantsColor: '#121218',
    shoeColor: '#1a1a22',
    hairStyle: 'dreads-short',
  },
  'freddie-mercury': {
    id: 'freddie-mercury',
    chassisColor: '#e8e4dc',
    accentColor: '#e8b830',
    trimColor: '#c84a3a',
    hairColor: '#2a2420',
    skinColor: '#e8ceb8',
    pantsColor: '#f0ebe3',
    shoeColor: '#3a3228',
    hairStyle: 'slick-back',
  },
  shakira: {
    id: 'shakira',
    chassisColor: '#c45c7a',
    accentColor: '#d4b878',
    trimColor: '#8e3d58',
    hairColor: '#c9a86c',
    skinColor: '#d4a882',
    pantsColor: '#4a3238',
    shoeColor: '#3a2828',
    hairStyle: 'wavy-long',
  },
};

export const DEFAULT_AGENT_AVATAR_DESIGN: Record<string, AvatarDesignId> = {
  'lib-apollo': 'michael-jackson',
  'lib-athena': 'shakira',
  'lib-hermes': 'freddie-mercury',
  'lib-hephaestus': 'bob-marley',
  'lib-iris': 'shakira',
  'lib-mnemosyne': 'freddie-mercury',
};

export const AVATAR_DESIGN_LABEL_KEYS: Record<AvatarDesignId, TranslationKey> = {
  'bob-marley': 'avatarDesigns.bobMarley',
  'michael-jackson': 'avatarDesigns.michaelJackson',
  'freddie-mercury': 'avatarDesigns.freddieMercury',
  shakira: 'avatarDesigns.shakira',
};

export function getAvatarDesign(id: AvatarDesignId): AvatarDesign {
  return AVATAR_DESIGNS[id];
}

export function resolveAvatarDesignId(agent: Pick<AgentDefinition, 'id' | 'avatarDesignId'>): AvatarDesignId {
  if (agent.avatarDesignId && agent.avatarDesignId in AVATAR_DESIGNS) {
    return agent.avatarDesignId;
  }
  return DEFAULT_AGENT_AVATAR_DESIGN[agent.id] ?? 'bob-marley';
}

export function applyAvatarDesigns(agents: AgentDefinition[]): AgentDefinition[] {
  return agents.map((agent) => {
    const designId = resolveAvatarDesignId(agent);
    const design = getAvatarDesign(designId);

    return {
      ...agent,
      avatarDesignId: designId,
      avatarColor: design.chassisColor,
      accentColor: design.accentColor,
    };
  });
}

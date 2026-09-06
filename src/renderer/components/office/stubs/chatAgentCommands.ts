export type AgentChatCommand = 'coffee' | 'relax' | 'desk' | 'focus';

const ACCENT_STRIP = /[^\p{L}\p{N}\s]/gu;

function normalize(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(ACCENT_STRIP, ' ')
    .replace(/\s+/g, ' ');
}

export function parseAgentChatCommand(content: string): AgentChatCommand | null {
  const text = normalize(content);
  if (!text) return null;

  if (
    /^(ve a |ir a |go )?(tomar )?(get )?(go get )?(un )?cafe\b/.test(text) ||
    /^coffee break$/.test(text) ||
    /^take coffee$/.test(text) ||
    text === 'cafe' ||
    text === 'coffee'
  ) {
    return 'coffee';
  }

  if (
    /^(relajate|relaja|relax|descansa|descanso)\b/.test(text) ||
    /^(ve a |ir a |go to )?(the )?living\b/.test(text) ||
    /^chill\b/.test(text) ||
    /^take a break$/.test(text)
  ) {
    return 'relax';
  }

  if (
    /^(focus|enfoca|enfocar|enfocate)\b/.test(text) ||
    /^(ve a |ir a |go to )?(the )?(center|centro|hub|team hub)\b/.test(text) ||
    /^(vuelve|volvi|regresa|back) (a |al |to )?(the )?(hub|centro)\b/.test(text) ||
    /^center desk$/.test(text) ||
    text === 'hub' ||
    text === 'centro'
  ) {
    return 'focus';
  }

  if (
    /^(vuelve|volvi|regresa|ir|go) (a |al |to )?(tu |your )?(desk|escritorio|puesto)\b/.test(text) ||
    /^(back to|go to) (your )?desk\b/.test(text) ||
    text === 'desk' ||
    text === 'escritorio'
  ) {
    return 'desk';
  }

  return null;
}

export type PeerMessage = { id: string; fromId: string; toId: string; text: string; at: number };

const threads = new Map<string, PeerMessage[]>();
const listeners = new Set<() => void>();

function threadKey(a: string, b: string): string {
  return [a, b].sort().join(':');
}

function notify(): void {
  listeners.forEach((fn) => fn());
}

export function subscribePeerChat(fn: () => void): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

export function listPeerThread(a: string, b: string): PeerMessage[] {
  return threads.get(threadKey(a, b)) ?? [];
}

export function listAllPeerMessages(): PeerMessage[] {
  const all: PeerMessage[] = [];
  threads.forEach((msgs) => { all.push(...msgs); });
  return all.sort((x, y) => x.at - y.at);
}

export function sendPeerMessage(fromId: string, toId: string, text: string): PeerMessage {
  const msg: PeerMessage = { id: crypto.randomUUID(), fromId, toId, text, at: Date.now() };
  const key = threadKey(fromId, toId);
  const prev = threads.get(key) ?? [];
  threads.set(key, [...prev, msg]);
  notify();
  return msg;
}

const AMBIENT: Record<string, string[]> = {
  'lib-apollo': ['Shipping the patch.', 'Need Athena on repro notes.', 'Hephaestus — isolate that null.'],
  'lib-athena': ['Brief ready.', 'Source check done.', 'Hermes, tighten the summary.'],
  'lib-hermes': ['Drafting copy.', 'Tone is dry and clear.', 'Iris — hierarchy looks off.'],
  'lib-hephaestus': ['Repro locked.', 'Smallest fix inbound.', 'Apollo, review the diff.'],
  'lib-iris': ['Tighten spacing.', 'Contrast is weak on that rail.', 'Mnemosyne, keep labels faithful.'],
  'lib-mnemosyne': ['Translation done.', 'Names left intact.', 'Athena, glossary synced.'],
}

let ambientTimer: ReturnType<typeof setInterval> | null = null;

export function startAmbientFloorChat(agentIds: string[]): void {
  if (ambientTimer || agentIds.length < 2) return;
  let i = 0;
  ambientTimer = setInterval(() => {
    const from = agentIds[i % agentIds.length];
    const to = agentIds[(i + 1) % agentIds.length];
    const lines = AMBIENT[from] ?? ['Checking in.'];
    sendPeerMessage(from, to, lines[i % lines.length]);
    i += 1;
  }, 3200);
}

export function stopAmbientFloorChat(): void {
  if (ambientTimer) clearInterval(ambientTimer);
  ambientTimer = null;
}

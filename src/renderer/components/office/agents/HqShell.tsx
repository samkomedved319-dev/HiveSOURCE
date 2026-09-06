import './HqShell.css';
import { useEffect, useMemo, useState } from 'react';
import type { AgentDefinition } from './types';
import { mockAgentReply } from './mockLlm';
import {
  listAllPeerMessages,
  sendPeerMessage,
  startAmbientFloorChat,
  stopAmbientFloorChat,
  subscribePeerChat,
  type PeerMessage,
} from './peerChat';

type Props = {
  agents: AgentDefinition[];
  activeAgentId: string | null;
  onSelectAgent?: (id: string) => void;
};

function nameOf(agents: AgentDefinition[], id: string): string {
  return agents.find((a) => a.id === id)?.name ?? id;
}

export function HqShell({ agents, activeAgentId, onSelectAgent }: Props) {
  const agent = useMemo(() => agents.find((a) => a.id === activeAgentId) ?? null, [agents, activeAgentId]);
  const [mode, setMode] = useState<'floor' | 'direct'>('floor');
  const [feed, setFeed] = useState<PeerMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [directLog, setDirectLog] = useState<{ role: 'user' | 'agent'; text: string }[]>([]);

  useEffect(() => {
    const ids = agents.map((a) => a.id);
    startAmbientFloorChat(ids);
    const refresh = () => setFeed(listAllPeerMessages());
    refresh();
    const unsub = subscribePeerChat(refresh);
    return () => {
      unsub();
      stopAmbientFloorChat();
    };
  }, [agents]);

  useEffect(() => {
    setDirectLog([]);
    setDraft('');
  }, [activeAgentId]);

  function sendDirect() {
    const text = draft.trim();
    if (!text || !agent) return;
    const reply = mockAgentReply(agent, text);
    setDirectLog((prev) => [...prev, { role: 'user', text }, { role: 'agent', text: reply }]);
    setDraft('');
  }

  function nudgePair() {
    if (agents.length < 2) return;
    const a = agents[Math.floor(Math.random() * agents.length)];
    let b = agents[Math.floor(Math.random() * agents.length)];
    if (b.id === a.id) b = agents[(agents.indexOf(a) + 1) % agents.length];
    const line = (a.hq?.mockReplies && a.hq.mockReplies[0]) || 'Ping.';
    sendPeerMessage(a.id, b.id, line);
  }

  return (
    <aside className="hq-shell" data-agent-id={agent?.id ?? 'floor'}>
      <header>
        <strong>Hive floor chat</strong>
        <span>Watch agent-to-agent traffic live</span>
        <div className="hq-mode">
          <button type="button" data-active={mode === 'floor'} onClick={() => setMode('floor')}>Floor</button>
          <button type="button" data-active={mode === 'direct'} onClick={() => setMode('direct')}>Direct</button>
        </div>
      </header>
      <nav className="hq-roster">
        {agents.map((a) => (
          <button
            key={a.id}
            type="button"
            data-active={a.id === activeAgentId}
            onClick={() => onSelectAgent?.(a.id)}
            title={a.role}
          >
            <span className="hq-dot" style={{ background: a.avatarColor }} />
            {a.name}
          </button>
        ))}
      </nav>
      {mode === 'floor' && (
        <section className="hq-floor">
          <div className="hq-log hq-log--floor">
            {feed.length === 0 && <p className="hq-muted">Waiting for floor traffic…</p>}
            {feed.map((m) => (
              <p key={m.id} className="hq-peer">
                <strong style={{ color: agents.find((a) => a.id === m.fromId)?.accentColor }}>{nameOf(agents, m.fromId)}</strong>
                <span className="hq-muted"> → {nameOf(agents, m.toId)}</span>
                <span className="hq-peer-text">{m.text}</span>
              </p>
            ))}
          </div>
          <button type="button" onClick={nudgePair}>Nudge pair</button>
        </section>
      )}
      {mode === 'direct' && (
        <section>
          {!agent && <p className="hq-muted">Select a Hive bot above for direct mock chat.</p>}
          {agent && (
            <>
              <p className="hq-muted">Direct with {agent.name} ({agent.id})</p>
              <div className="hq-log">
                {directLog.map((m, i) => (
                  <p key={i} data-role={m.role}>{m.text}</p>
                ))}
              </div>
              <form onSubmit={(e) => { e.preventDefault(); sendDirect(); }}>
                <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={"Message " + agent.name} />
                <button type="submit">Send</button>
              </form>
            </>
          )}
        </section>
      )}
    </aside>
  );
}

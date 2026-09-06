import { useAgentsStore } from './agentsStore';
import './AgentChatPanel.css';

/**
 * AgentOps seam: replace this mock panel with real chat wiring.
 * Subscribes to activeAgentId / selectedAgentId from the shared store.
 */
export function AgentChatPanel() {
  const agents = useAgentsStore((s) => s.agents);
  const activeAgentId = useAgentsStore((s) => s.activeAgentId);
  const selectedAgentId = useAgentsStore((s) => s.selectedAgentId);
  const openChat = useAgentsStore((s) => s.openChat);
  const closeChat = useAgentsStore((s) => s.closeChat);
  const focusOnAgent = useAgentsStore((s) => s.focusOnAgent);

  const active = agents.find((a) => a.id === activeAgentId) ?? null;
  const selected = agents.find((a) => a.id === selectedAgentId) ?? null;

  return (
    <aside className="agent-panel" aria-label="Agent chat panel">
      <header className="agent-panel__header">
        <h2>Agents</h2>
        <p className="agent-panel__hint">AgentOps seam — mock chat</p>
      </header>

      <ul className="agent-panel__list">
        {agents.map((agent) => (
          <li key={agent.id}>
            <button
              type="button"
              className={
                agent.id === selectedAgentId
                  ? 'agent-panel__item agent-panel__item--selected'
                  : 'agent-panel__item'
              }
              style={{ borderColor: agent.accentColor }}
              onClick={() => {
                focusOnAgent(agent.id);
                openChat(agent.id);
              }}
            >
              <span
                className="agent-panel__swatch"
                style={{ background: agent.avatarColor }}
              />
              <span>
                <strong>{agent.name}</strong>
                <small>{agent.role}</small>
              </span>
            </button>
          </li>
        ))}
      </ul>

      <section className="agent-panel__chat">
        {active ? (
          <>
            <div className="agent-panel__chat-bar">
              <strong style={{ color: active.accentColor }}>{active.name}</strong>
              <button type="button" onClick={closeChat}>
                Close
              </button>
            </div>
            <div className="agent-panel__messages">
              <p className="agent-panel__msg agent-panel__msg--system">
                Mock chat for <code>{active.id}</code>. AgentOps will replace this.
              </p>
              <p className="agent-panel__msg">
                Zone: {active.homeZone}
                {active.wallDeskSlot != null ? ` · desk ${active.wallDeskSlot}` : ''}
              </p>
            </div>
            <form
              className="agent-panel__compose"
              onSubmit={(e) => {
                e.preventDefault();
              }}
            >
              <input
                type="text"
                placeholder={`Message ${active.name}…`}
                disabled
                aria-label="Message (placeholder)"
              />
              <button type="submit" disabled>
                Send
              </button>
            </form>
          </>
        ) : (
          <p className="agent-panel__empty">
            {selected
              ? `Selected ${selected.name} — open chat from the list.`
              : 'Select an agent to open mock chat.'}
          </p>
        )}
      </section>
    </aside>
  );
}

import { useEffect } from "react";
import { SceneCanvas } from "./SceneCanvas";
import { HqShell, useAgentsStore, openChat } from "./agents";
import "./office.css";

/**
 * Native HiveSOURCE office tab — Map.WebGL OfficeScene + AgentOps HQ.
 * Roster = Hive PREMADE_BOTS (lib-*). Right panel = live agent-to-agent floor chat.
 */
export default function OfficeOverlay() {
  const hydrate = useAgentsStore((s) => s.hydrate);
  const status = useAgentsStore((s) => s.status);
  const error = useAgentsStore((s) => s.error);
  const agents = useAgentsStore((s) => s.agents);
  const activeAgentId = useAgentsStore((s) => s.activeAgentId);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  return (
    <div className="hive-office-native">
      {status === "error" && (
        <div className="hive-office-native__banner hive-office-native__banner--error" role="alert">
          Agents config failed: {error}
        </div>
      )}
      {status === "loading" && (
        <div className="hive-office-native__banner">Loading agents.</div>
      )}
      <div className="hive-office-native__scene">
        <SceneCanvas />
      </div>
      <HqShell
        agents={agents}
        activeAgentId={activeAgentId}
        onSelectAgent={(id) => openChat(id)}
      />
    </div>
  );
}

export { OfficeScene } from "./office/OfficeScene";
export { SceneCanvas } from "./SceneCanvas";


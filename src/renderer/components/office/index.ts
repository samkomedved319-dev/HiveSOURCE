/** Native Map.WebGL isometric office for HiveSOURCE (Codder mounts when mainView==='office'). */

/** Preferred scene root - r3f Canvas + isometric office. */
export { OfficeScene } from './office/OfficeScene';

/** Host with agents hydrate + bridge sync + focus camera. */
export { SceneCanvas } from './SceneCanvas';

/** App mount: SceneCanvas + HqShell (roster / right-panel chat). */
export { default as OfficeOverlay } from './OfficeOverlay';
export { default } from './OfficeOverlay';

/** CrewPanel shims */
export { default as HiveOffice } from './HiveOffice';
export { default as HiveWork } from './HiveWork';

export { useAgentsStore, focusOnAgent, openChat, loadAgentsConfig } from './agents';
export type { AgentDefinition } from './agents';

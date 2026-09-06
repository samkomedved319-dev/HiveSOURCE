import React from 'react';
import { SceneCanvas } from './SceneCanvas';
import './office.css';

/**
 * CrewPanel / side-panel host for the native Map.WebGL OfficeScene.
 * Compact mode fills the crew canvas; full mode is the same scene stack.
 */
export default function HiveOffice({
  onBack,
  compact,
}: {
  onBack?: () => void;
  compact?: boolean;
}) {
  return (
    <div
      className={compact ? 'hive-office-native hive-office-native--compact' : 'hive-office-native'}
      style={{ width: '100%', height: compact ? '100%' : '100%', minHeight: compact ? 280 : 0 }}
    >
      {onBack ? (
        <button type="button" className="hive-office-native__banner" onClick={onBack}>
          Back
        </button>
      ) : null}
      <div className="hive-office-native__scene">
        <SceneCanvas />
      </div>
    </div>
  );
}

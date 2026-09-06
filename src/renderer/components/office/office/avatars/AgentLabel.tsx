import { Billboard, Text } from '@react-three/drei';
import { useTranslation } from '@/components/office/stubs/i18n';
import type { AgentStatus } from '@/components/office/types/agent';
import type { UserChatVisualMode } from '@/components/office/stubs/chatVisualMode';
import type { TranslationKey } from '@/components/office/stubs/i18nTypes';

interface AgentLabelProps {
  name: string;
  role?: string;
  modelId?: string;
  status: AgentStatus;
  socialChat?: boolean;
  userChatMode?: UserChatVisualMode;
  accentColor: string;
  selected: boolean;
}

function statusColor(
  status: AgentStatus,
  socialChat: boolean,
  userChatMode: UserChatVisualMode,
): string {
  if (userChatMode === 'thinking') return '#d4a574';
  if (userChatMode === 'streaming') return '#e2725b';
  if (socialChat) return '#a8c4a0';
  if (status === 'chatting') return '#d4a574';
  if (status === 'coffee') return '#c8a882';
  if (status === 'coffee-queue') return '#a8b5a0';
  if (status === 'walking') return '#c8d4a8';
  return '#9aab9e';
}

function statusLabelKey(
  status: AgentStatus,
  socialChat: boolean,
  userChatMode: UserChatVisualMode,
): TranslationKey {
  if (userChatMode === 'thinking') return 'avatar.thinking';
  if (userChatMode === 'streaming') return 'avatar.replying';
  if (socialChat) return 'avatar.talking';
  if (status === 'chatting') return 'avatar.inChat';
  if (status === 'coffee') return 'avatar.coffeeBreak';
  if (status === 'coffee-queue') return 'avatar.inLine';
  if (status === 'walking') return 'avatar.moving';
  return 'avatar.available';
}

export function AgentLabel({
  name,
  status,
  socialChat = false,
  userChatMode = 'off',
  accentColor,
  selected,
}: AgentLabelProps) {
  const { t } = useTranslation();

  return (
    <Billboard position={[0, 1.16, 0]} follow lockX lockZ>
      <group>
        {selected && (
          <mesh position={[0, 0.04, -0.02]}>
            <planeGeometry args={[0.52, 0.2]} />
            <meshBasicMaterial color={accentColor} transparent opacity={0.2} />
          </mesh>
        )}
        <Text
          fontSize={0.08}
          color="#f5f3ef"
          anchorX="center"
          anchorY="bottom"
          outlineWidth={0.008}
          outlineColor="#2a3d34"
          maxWidth={1.2}
        >
          {name}
        </Text>
        <Text
          position={[0, -0.055, 0]}
          fontSize={0.034}
          color={statusColor(status, socialChat, userChatMode)}
          anchorX="center"
          anchorY="top"
          letterSpacing={0.03}
        >
          {t(statusLabelKey(status, socialChat, userChatMode))}
        </Text>
      </group>
    </Billboard>
  );
}

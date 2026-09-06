import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Text } from '@react-three/drei';
import * as THREE from 'three';

type BubbleVariant = 'user-chat' | 'user-thinking' | 'user-streaming' | 'peer';

interface ConversationSpeechBubbleProps {
  variant: BubbleVariant;
  text?: string;
  streaming?: boolean;
}

const CLOUD = '#faf8f4';
const DOT_SAGE = '#8fa38c';
const DOT_TERRACOTTA = '#e2725b';
const DOT_THINKING = '#d4a574';

function ThinkingThoughtBubble() {
  const dotsRef = useRef<THREE.Group>(null);
  const cloudRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (cloudRef.current) {
      const pulse = 1 + Math.sin(t * 2.8) * 0.035;
      cloudRef.current.scale.setScalar(pulse);
    }
    if (!dotsRef.current) return;
    dotsRef.current.children.forEach((dot, i) => {
      dot.position.y = Math.sin(t * 3.2 + i * 1.35) * 0.01;
    });
  });

  return (
    <group position={[0.34, 0.74, 0.05]} rotation={[0, -0.32, 0.06]} scale={0.92}>
      <group ref={cloudRef}>
        <mesh position={[-0.05, -0.1, 0]}>
          <sphereGeometry args={[0.016, 6, 6]} />
          <meshBasicMaterial color={CLOUD} transparent opacity={0.9} />
        </mesh>
        <mesh position={[-0.025, -0.055, 0]}>
          <sphereGeometry args={[0.022, 6, 6]} />
          <meshBasicMaterial color={CLOUD} transparent opacity={0.92} />
        </mesh>
        <mesh position={[0, 0.01, 0]}>
          <sphereGeometry args={[0.052, 8, 8]} />
          <meshBasicMaterial color={CLOUD} transparent opacity={0.94} />
        </mesh>
        <mesh position={[0.038, 0.018, 0]}>
          <sphereGeometry args={[0.038, 8, 8]} />
          <meshBasicMaterial color={CLOUD} transparent opacity={0.94} />
        </mesh>
        <mesh position={[-0.034, 0.024, 0]}>
          <sphereGeometry args={[0.034, 8, 8]} />
          <meshBasicMaterial color={CLOUD} transparent opacity={0.94} />
        </mesh>
      </group>
      <group ref={dotsRef} position={[0, 0.01, 0.02]}>
        {[-0.028, 0, 0.028].map((x, i) => (
          <mesh key={i} position={[x, 0, 0.012]}>
            <sphereGeometry args={[0.011, 6, 6]} />
            <meshBasicMaterial color={DOT_THINKING} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function StandardSpeechBubble({ variant }: { variant: Exclude<BubbleVariant, 'user-thinking'> }) {
  const dotsRef = useRef<THREE.Group>(null);
  const scale = variant === 'peer' ? 0.82 : 1;
  const offsetX = variant === 'peer' ? 0.28 : 0.38;
  const offsetY = variant === 'peer' ? 0.5 : 0.58;

  useFrame((state) => {
    if (!dotsRef.current) return;
    const speed = variant === 'user-streaming' ? 9 : variant === 'user-chat' ? 5.5 : 4.2;
    const t = state.clock.elapsedTime * speed;
    dotsRef.current.children.forEach((dot, i) => {
      dot.position.y = Math.sin(t + i * 1.2) * 0.012;
    });
  });

  const dotColor = variant === 'user-streaming' ? DOT_TERRACOTTA : DOT_SAGE;

  return (
    <group position={[offsetX * scale, offsetY * scale, 0.04 * scale]} rotation={[0, -0.35, 0.08]} scale={scale}>
      <mesh>
        <boxGeometry args={[0.16, 0.1, 0.02]} />
        <meshBasicMaterial color={CLOUD} transparent opacity={0.94} />
      </mesh>
      <mesh position={[-0.06, -0.03, 0]} rotation={[0, 0, 0.55]}>
        <boxGeometry args={[0.04, 0.04, 0.015]} />
        <meshBasicMaterial color={CLOUD} transparent opacity={0.94} />
      </mesh>
      <group ref={dotsRef}>
        {[-0.04, 0, 0.04].map((x, i) => (
          <mesh key={i} position={[x, 0.01, 0.014]}>
            <sphereGeometry args={[0.012, 6, 6]} />
            <meshBasicMaterial color={dotColor} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function PeerTextBubble({ text, streaming }: { text: string; streaming: boolean }) {
  return (
    <Billboard position={[0.34, 0.78, 0.06]} follow lockX lockZ>
      <group rotation={[0, -0.2, 0.04]} scale={0.88}>
        <mesh position={[0, 0, -0.01]}>
          <planeGeometry args={[0.72, 0.22]} />
          <meshBasicMaterial color={CLOUD} transparent opacity={0.95} />
        </mesh>
        <mesh position={[-0.12, -0.1, -0.01]} rotation={[0, 0, 0.45]}>
          <planeGeometry args={[0.06, 0.06]} />
          <meshBasicMaterial color={CLOUD} transparent opacity={0.95} />
        </mesh>
        <Text
          fontSize={0.042}
          color="#2a3228"
          anchorX="center"
          anchorY="middle"
          maxWidth={0.64}
          textAlign="center"
          lineHeight={1.15}
        >
          {text}
          {streaming ? '…' : ''}
        </Text>
      </group>
    </Billboard>
  );
}

export function ConversationSpeechBubble({
  variant,
  text,
  streaming = false,
}: ConversationSpeechBubbleProps) {
  if (variant === 'user-thinking') {
    return <ThinkingThoughtBubble />;
  }

  if (variant === 'peer' && text) {
    return <PeerTextBubble text={text} streaming={streaming} />;
  }

  return <StandardSpeechBubble variant={variant} />;
}

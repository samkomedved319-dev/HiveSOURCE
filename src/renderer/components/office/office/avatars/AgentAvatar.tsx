import { useFrame } from '@react-three/fiber';
import { startTransition, useRef, useMemo } from 'react';
import * as THREE from 'three';
import type { AgentDefinition, AgentRuntimeState, AgentStatus } from '@/components/office/types/agent';
import { OFFICE_PALETTE } from '@/components/office/config/agents.config';
import { getAvatarDesign, resolveAvatarDesignId } from '@/components/office/config/avatarDesigns';
import { getAgentChatAnchor, getAgentPuffScale, isNearChatAnchor } from '@/components/office/config/agentZones.config';
import { useSceneStore } from '@/components/office/runtime/scene.store';
import { focusOnAgent as hiveFocusOnAgent, openChat as hiveOpenChat } from '@/components/office/agents';
import { preloadChatAssets } from '@/components/office/stubs/preloadChatPanel';
import { AgentLabel } from './AgentLabel';
import { AgentRoleLogo } from './AgentRoleLogo';
import { AVATAR_SCALE } from './avatarConstants';
import {
  AgentArmSegment,
  AgentHumanHead,
  AgentShinFoot,
  AgentThigh,
  AgentTorso,
  AVATAR_SOLE,
} from './AgentAvatarVisuals';
import {
  easeSitBlend,
  getSeatStyle,
  getSitPoseTargets,
  lerpSitValue,
  LEG_HIP_STAND_Y,
} from './agentSitPose';
import {
  easeCoffeeBlend,
  getCoffeePoseFrame,
  lerpCoffeeValue,
} from './agentCoffeePose';
import { getWalkPoseFrame } from './agentWalkPose';
import { CoffeeHandCup } from './CoffeeHandCup';
import { ConversationSpeechBubble } from './ConversationSpeechBubble';
import { AgentThinkingAura } from './AgentThinkingAura';
import { OUTLINE_COLOR, softColor } from '../materials';
import { clampToWalkable } from '@/components/office/utils/collision';
import { lerpAngle } from '@/components/office/utils/movement';
import { useShallow } from 'zustand/react/shallow';
import { useConversationVisualsStore } from '@/components/office/stubs/conversationVisuals.store';
import { useAgentsStore } from '@/components/office/runtime/agents.store';

interface AgentAvatarProps {
  definition: AgentDefinition;
  runtime: AgentRuntimeState;
}

const POS_SMOOTH = 9;
const ROT_SMOOTH_WALK = 16;
const ROT_SMOOTH_IDLE = 10;
const MIN_WALK_SPEED = 0.1;
const TARGET = new THREE.Vector3();
const EYE_MAT = softColor('#2a3228');
const EYE_WHITE = softColor('#f7f4ef', { roughness: 0.92 });
const CHEEK_TONE = softColor('#d8a090', { roughness: 0.98, emissive: '#d8a090', emissiveIntensity: 0.08 });
const NOSE_TONE = softColor('#c08878', { roughness: 0.95 });

function hashPhase(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return (h % 628) / 100;
}

function lerpArmRotation(
  arm: THREE.Group,
  target: { rotX: number; rotY: number; rotZ: number },
  rate: number,
): void {
  arm.rotation.x = THREE.MathUtils.lerp(arm.rotation.x, target.rotX, rate);
  arm.rotation.y = THREE.MathUtils.lerp(arm.rotation.y, target.rotY, rate);
  arm.rotation.z = THREE.MathUtils.lerp(arm.rotation.z, target.rotZ, rate);
}

export function AgentAvatar({ definition, runtime }: AgentAvatarProps) {
  const groupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const leftShinRef = useRef<THREE.Group>(null);
  const rightShinRef = useRef<THREE.Group>(null);
  const sitBlendRef = useRef(0);
  const coffeeBlendRef = useRef(0);
  const walkBlendRef = useRef(0);
  const visualRotRef = useRef<number | null>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const hoverRef = useRef(0);
  const chatPreloadedRef = useRef(false);
  const selectedId = useSceneStore((s) => s.selectedAgentId);
  const sceneFocusOnAgent = useSceneStore((s) => s.focusOnAgent);
  const peerPartnerId = useConversationVisualsStore((s) => {
    for (const chat of s.peerConversations) {
      if (chat.agentA === definition.id) return chat.agentB;
      if (chat.agentB === definition.id) return chat.agentA;
    }
    return null;
  });
  const peerSpeech = useConversationVisualsStore(
    useShallow((s) => {
      for (const chat of s.peerConversations) {
        if (chat.agentA !== definition.id && chat.agentB !== definition.id) continue;
        const isSpeaker = chat.lastSpeakerId === definition.id;
        const isGenerating = chat.generatingAgentId === definition.id;
        return {
          text: isSpeaker ? chat.lastMessage : undefined,
          streaming: isSpeaker && chat.streaming,
          isGenerating: isGenerating && !chat.lastMessage,
        };
      }
      return { text: undefined as string | undefined, streaming: false, isGenerating: false };
    }),
  );
  const userChatAgentId = useConversationVisualsStore((s) => s.userChatAgentId);
  const userChatMode = useConversationVisualsStore((s) => s.userChatMode);
  const isUserChatAgent = userChatAgentId === definition.id;
  const peerPosition = useAgentsStore((s) =>
    peerPartnerId ? s.runtime[peerPartnerId]?.position : undefined,
  );
  const isSelected = selectedId === definition.id;
  const phase = useMemo(() => hashPhase(definition.id), [definition.id]);
  const avatarDesign = useMemo(
    () => getAvatarDesign(resolveAvatarDesignId(definition)),
    [definition],
  );
  const seatStyle = useMemo(() => getSeatStyle(definition), [definition]);
  const puffScale = useMemo(() => getAgentPuffScale(definition), [definition]);
  const chatAnchor = useMemo(() => getAgentChatAnchor(definition), [definition]);
  const sitPose = useMemo(
    () => getSitPoseTargets(seatStyle, puffScale),
    [seatStyle, puffScale],
  );

  const shirtMat = useMemo(
    () =>
      softColor(definition.avatarColor, {
        emissive: definition.avatarColor,
        emissiveIntensity: isSelected ? 0.12 : 0.05,
        roughness: 0.82,
      }),
    [definition.avatarColor, isSelected],
  );
  const accentMat = useMemo(
    () => softColor(definition.accentColor, { roughness: 0.84, metalness: 0.04 }),
    [definition.accentColor],
  );
  const trimMat = useMemo(
    () => softColor(avatarDesign.trimColor, { roughness: 0.86 }),
    [avatarDesign.trimColor],
  );
  const skinMat = useMemo(
    () => softColor(avatarDesign.skinColor, { roughness: 0.9 }),
    [avatarDesign.skinColor],
  );
  const pantsMat = useMemo(
    () => softColor(avatarDesign.pantsColor, { roughness: 0.93 }),
    [avatarDesign.pantsColor],
  );
  const shoeMat = useMemo(
    () => softColor(avatarDesign.shoeColor, { roughness: 0.8 }),
    [avatarDesign.shoeColor],
  );
  const soleMat = useMemo(() => softColor(AVATAR_SOLE, { roughness: 0.95 }), []);
  const hairMat = useMemo(
    () => softColor(avatarDesign.hairColor, { roughness: 0.92 }),
    [avatarDesign.hairColor],
  );
  const gloveMat = useMemo(
    () =>
      softColor('#f4f2ee', {
        roughness: 0.35,
        metalness: 0.08,
        emissive: '#ffffff',
        emissiveIntensity: 0.08,
      }),
    [],
  );
  const eyeWhiteMat = useMemo(() => EYE_WHITE.clone(), []);
  const eyeMat = useMemo(() => EYE_MAT.clone(), []);
  const cheekMat = useMemo(() => CHEEK_TONE.clone(), []);
  const noseMat = useMemo(() => NOSE_TONE.clone(), []);
  const isMj = avatarDesign.id === 'michael-jackson';

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const [x, , z] = runtime.position;
    const walking = runtime.status === 'walking';
    const chatting = runtime.status === 'chatting';
    const socialChat = Boolean(peerPartnerId) && !chatting;

    if (walking) {
      groupRef.current.position.x = x;
      groupRef.current.position.z = z;
    } else {
      TARGET.set(x, 0, z);
      groupRef.current.position.lerp(TARGET, 1 - Math.exp(-POS_SMOOTH * delta));
      if (!chatting) {
        const clamped = clampToWalkable([
          groupRef.current.position.x,
          groupRef.current.position.y,
          groupRef.current.position.z,
        ]);
        groupRef.current.position.x = clamped[0];
        groupRef.current.position.z = clamped[2];
      }
    }

    const movingOnFoot = walking && runtime.moveSpeed >= MIN_WALK_SPEED;

    walkBlendRef.current = THREE.MathUtils.lerp(
      walkBlendRef.current,
      movingOnFoot ? 1 : 0,
      1 - Math.exp(-(movingOnFoot ? 10 : 12) * delta),
    );

    const rotSmooth = movingOnFoot ? ROT_SMOOTH_WALK : socialChat ? 8 : ROT_SMOOTH_IDLE;
    if (visualRotRef.current === null) {
      visualRotRef.current = runtime.rotation;
    }

    let targetRotation = runtime.rotation;
    if (socialChat && peerPosition) {
      targetRotation = Math.atan2(peerPosition[0] - x, peerPosition[2] - z);
    }

    visualRotRef.current = lerpAngle(
      visualRotRef.current,
      targetRotation,
      1 - Math.exp(-rotSmooth * delta),
    );
    groupRef.current.rotation.y = visualRotRef.current;

    const t = state.clock.elapsedTime + phase;
    const atCoffee = runtime.status === 'coffee';
    const walkPose = getWalkPoseFrame(t, phase, movingOnFoot ? runtime.moveSpeed : 0, walkBlendRef.current);
    const walkingAnim = walkPose.walkBlend > 0.02;
    const atSeat = isNearChatAnchor(runtime.position, chatAnchor);
    const shouldSit =
      runtime.posture === 'sit' &&
      (runtime.status === 'chatting' || (runtime.status === 'idle' && atSeat));

    const sitTarget = shouldSit ? 1 : 0;
    sitBlendRef.current = THREE.MathUtils.lerp(
      sitBlendRef.current,
      sitTarget,
      1 - Math.exp(-6.5 * delta),
    );
    const sitEase = easeSitBlend(sitBlendRef.current);
    const sitting = sitEase > 0.02;

    const coffeeTarget = atCoffee ? 1 : 0;
    coffeeBlendRef.current = THREE.MathUtils.lerp(
      coffeeBlendRef.current,
      coffeeTarget,
      1 - Math.exp(-5.5 * delta),
    );
    const coffeeEase = easeCoffeeBlend(coffeeBlendRef.current);
    const coffeePose = atCoffee ? getCoffeePoseFrame(state.clock.elapsedTime, phase) : null;

    const standBob = walkingAnim
      ? walkPose.bodyBob
      : chatting
        ? Math.sin(t * 5) * 0.016
        : atCoffee
          ? Math.sin(t * 2.8) * 0.008
          : Math.sin(t * 3.2) * 0.012;

    groupRef.current.position.y = lerpSitValue(standBob, 0, sitEase) + sitPose.groupY * sitEase;

    if (bodyRef.current) {
      bodyRef.current.position.x = THREE.MathUtils.lerp(
        bodyRef.current.position.x,
        walkPose.hipOffsetX * (1 - sitEase),
        0.22,
      );
      bodyRef.current.position.y = lerpSitValue(0, sitPose.bodyY, sitEase);
      const walkLean = walkingAnim && sitEase < 0.5 ? walkPose.bodyLeanX : 0;
      const chatLean = chatting && sitEase > 0.6 ? 0.02 : 0;
      const coffeeLean = coffeePose ? coffeePose.bodyRotX * coffeeEase : 0;
      bodyRef.current.rotation.x = lerpSitValue(
        walkLean + chatLean + coffeeLean,
        sitPose.bodyRotX,
        sitEase,
      );
      const sway = walkingAnim && sitEase < 0.35 ? walkPose.bodySwayZ : 0;
      bodyRef.current.rotation.z = lerpSitValue(sway, sitPose.bodyRotZ, sitEase);
    }

    const idleArm = sitting && !walking ? sitPose.armRotX : 0;
    const idleArmSwing =
      socialChat && sitEase < 0.5
        ? Math.sin(t * 4.5) * 0.12
        : chatting && sitEase > 0.5
          ? Math.sin(t * 4) * 0.14
          : atCoffee
            ? Math.sin(t * 3.5) * 0.08
            : 0;
    const leftArmBase = walkingAnim
      ? lerpSitValue(walkPose.leftArmX, idleArm, sitEase)
      : lerpSitValue(idleArmSwing, idleArm, sitEase);
    const rightArmBase = walkingAnim
      ? lerpSitValue(walkPose.rightArmX, idleArm, sitEase)
      : lerpSitValue(-idleArmSwing, idleArm, sitEase);

    const leftArmTarget = {
      rotX: coffeePose
        ? lerpCoffeeValue(leftArmBase, coffeePose.leftArm.rotX, coffeeEase)
        : leftArmBase,
      rotY: coffeePose ? coffeePose.leftArm.rotY * coffeeEase : 0,
      rotZ: coffeePose
        ? coffeePose.leftArm.rotZ * coffeeEase
        : walkingAnim
          ? walkPose.leftArmZ
          : 0,
    };
    const rightArmTarget = {
      rotX: coffeePose
        ? lerpCoffeeValue(rightArmBase, coffeePose.rightArm.rotX, coffeeEase)
        : rightArmBase,
      rotY: coffeePose ? coffeePose.rightArm.rotY * coffeeEase : 0,
      rotZ: coffeePose
        ? coffeePose.rightArm.rotZ * coffeeEase
        : walkingAnim
          ? walkPose.rightArmZ
          : 0,
    };

    if (leftArmRef.current) {
      lerpArmRotation(leftArmRef.current, leftArmTarget, 0.22);
    }
    if (rightArmRef.current) {
      lerpArmRotation(rightArmRef.current, rightArmTarget, 0.22);
    }

    const leftThighX = walkingAnim
      ? lerpSitValue(walkPose.leftThighX, sitPose.thighRotX, sitEase)
      : lerpSitValue(0, sitPose.thighRotX, sitEase);
    const rightThighX = walkingAnim
      ? lerpSitValue(walkPose.rightThighX, sitPose.thighRotX, sitEase)
      : lerpSitValue(0, sitPose.thighRotX, sitEase);
    const leftShinX = walkingAnim
      ? lerpSitValue(walkPose.leftShinX, sitPose.shinRotX, sitEase)
      : lerpSitValue(0, sitPose.shinRotX, sitEase);
    const rightShinX = walkingAnim
      ? lerpSitValue(walkPose.rightShinX, sitPose.shinRotX, sitEase)
      : lerpSitValue(0, sitPose.shinRotX, sitEase);
    const spread = sitPose.legSpreadZ * sitEase;
    const legZ = sitPose.legOffsetZ * sitEase;

    const legHipY = lerpSitValue(LEG_HIP_STAND_Y, sitPose.legHipY, sitEase);

    if (leftLegRef.current) {
      leftLegRef.current.position.y = THREE.MathUtils.lerp(leftLegRef.current.position.y, legHipY, 0.2);
      leftLegRef.current.rotation.x = THREE.MathUtils.lerp(leftLegRef.current.rotation.x, leftThighX, 0.22);
      leftLegRef.current.rotation.z = THREE.MathUtils.lerp(leftLegRef.current.rotation.z, spread, 0.2);
      leftLegRef.current.position.z = THREE.MathUtils.lerp(leftLegRef.current.position.z, legZ, 0.2);
    }
    if (rightLegRef.current) {
      rightLegRef.current.position.y = THREE.MathUtils.lerp(rightLegRef.current.position.y, legHipY, 0.2);
      rightLegRef.current.rotation.x = THREE.MathUtils.lerp(rightLegRef.current.rotation.x, rightThighX, 0.22);
      rightLegRef.current.rotation.z = THREE.MathUtils.lerp(
        rightLegRef.current.rotation.z,
        -spread,
        0.2,
      );
      rightLegRef.current.position.z = THREE.MathUtils.lerp(rightLegRef.current.position.z, legZ, 0.2);
    }
    if (leftShinRef.current) {
      leftShinRef.current.rotation.x = THREE.MathUtils.lerp(
        leftShinRef.current.rotation.x,
        leftShinX,
        0.22,
      );
    }
    if (rightShinRef.current) {
      rightShinRef.current.rotation.x = THREE.MathUtils.lerp(
        rightShinRef.current.rotation.x,
        rightShinX,
        0.22,
      );
    }

    if (headRef.current) {
      let peerLookY = 0;
      if (socialChat && peerPosition) {
        const dx = peerPosition[0] - x;
        const dz = peerPosition[2] - z;
        peerLookY = THREE.MathUtils.clamp(
          Math.atan2(dx, dz) - groupRef.current.rotation.y,
          -0.42,
          0.42,
        );
      }

      const lookAmp = chatting ? sitPose.headRotYChat : atCoffee ? 0.02 : walkingAnim ? 0.02 : socialChat ? 0.03 : 0.03;
      const look = Math.sin(t * (chatting ? 2.5 : atCoffee ? 1.6 : socialChat ? 3.2 : walkingAnim ? 5 : 1.8)) * lookAmp;
      const coffeeHeadY = coffeePose ? coffeePose.headRotY * coffeeEase : 0;
      const walkHeadY = walkingAnim ? walkPose.headRotY : 0;
      headRef.current.rotation.y = THREE.MathUtils.lerp(
        headRef.current.rotation.y,
        look + coffeeHeadY + walkHeadY + peerLookY,
        0.12,
      );
      const nod = chatting ? Math.sin(t * 3.2) * 0.06 : 0;
      const coffeeNod = coffeePose ? coffeePose.headRotX * coffeeEase : 0;
      const walkNod = walkingAnim ? walkPose.headRotX : 0;
      headRef.current.rotation.x = lerpSitValue(
        nod + coffeeNod + walkNod,
        sitPose.headRotX + nod * 0.5,
        sitEase,
      );
      headRef.current.rotation.z = THREE.MathUtils.lerp(
        headRef.current.rotation.z,
        coffeePose ? coffeePose.headRotZ * coffeeEase : 0,
        0.14,
      );
    }

    if (ringRef.current && isSelected) {
      const pulse = 0.85 + Math.sin(t * 4) * 0.15;
      ringRef.current.scale.setScalar(pulse);
      const mat = ringRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.55 + Math.sin(t * 4) * 0.2;
    }

    hoverRef.current = THREE.MathUtils.lerp(hoverRef.current, 0, 0.1);
    const scale = 1 + hoverRef.current * 0.04;
    if (bodyRef.current) bodyRef.current.scale.setScalar(scale);
  });

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    sceneFocusOnAgent(definition.id);
    hiveFocusOnAgent(definition.id);
    startTransition(() => {
      hiveOpenChat(definition.id);
    });
  };

  const handlePointerOver = () => {
    document.body.style.cursor = 'pointer';
    hoverRef.current = 1;
    if (!chatPreloadedRef.current) {
      chatPreloadedRef.current = true;
      preloadChatAssets({ markdown: true });
    }
  };

  const status: AgentStatus =
    runtime.status === 'chatting'
      ? 'chatting'
      : runtime.status === 'coffee'
        ? 'coffee'
        : runtime.status === 'coffee-queue'
          ? 'coffee-queue'
          : runtime.status === 'walking'
            ? 'walking'
            : 'idle';

  const socialChat = Boolean(peerPartnerId) && runtime.status !== 'chatting';
  const peerBubbleText = peerSpeech.text;
  const isPeerGenerating = peerSpeech.isGenerating;
  const speechVariant =
    runtime.status === 'chatting' && isUserChatAgent
      ? userChatMode === 'thinking'
        ? 'user-thinking'
        : userChatMode === 'streaming'
          ? 'user-streaming'
          : 'user-chat'
      : socialChat
        ? isPeerGenerating && !peerBubbleText
          ? 'user-thinking'
          : 'peer'
        : null;

  const showThinkingAura =
    runtime.status === 'chatting' && isUserChatAgent && userChatMode === 'thinking';

  return (
    <group ref={groupRef} position={runtime.position} userData={{ blockPan: true }}>
      <group scale={AVATAR_SCALE}>
      {isSelected && (
        <>
          <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.48, 36]} />
            <meshBasicMaterial color={OFFICE_PALETTE.selectionGlow} transparent opacity={0.22} />
          </mesh>
          <mesh ref={ringRef} position={[0, 0.018, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.3, 0.38, 36]} />
            <meshBasicMaterial color={OFFICE_PALETTE.terracottaLight} transparent opacity={0.75} />
          </mesh>
        </>
      )}

      <group
        ref={bodyRef}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={() => {
          document.body.style.cursor = 'default';
          hoverRef.current = 0;
        }}
      >
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0]}>
          <circleGeometry args={[0.22, 24]} />
          <meshBasicMaterial color="#1a2820" transparent opacity={0.2} />
        </mesh>

        <group ref={leftLegRef} position={[-0.058, 0.18, 0]}>
          <AgentThigh pantsMat={pantsMat} />
          <group ref={leftShinRef} position={[0, -0.12, 0]}>
            <AgentShinFoot pantsMat={pantsMat} shoeMat={shoeMat} soleMat={soleMat} />
          </group>
        </group>
        <group ref={rightLegRef} position={[0.058, 0.18, 0]}>
          <AgentThigh pantsMat={pantsMat} />
          <group ref={rightShinRef} position={[0, -0.12, 0]}>
            <AgentShinFoot pantsMat={pantsMat} shoeMat={shoeMat} soleMat={soleMat} />
          </group>
        </group>

        <AgentTorso
          designId={avatarDesign.id}
          shirtMat={shirtMat}
          pantsMat={pantsMat}
          accentMat={accentMat}
          trimMat={trimMat}
          outlineColor={OUTLINE_COLOR}
        />

        <group ref={leftArmRef} position={[-0.135, 0.38, 0]}>
          <AgentArmSegment
            shirtMat={shirtMat}
            skinMat={skinMat}
            accentMat={accentMat}
            side={-1}
          />
        </group>
        <group ref={rightArmRef} position={[0.135, 0.38, 0]}>
          <AgentArmSegment
            shirtMat={shirtMat}
            skinMat={skinMat}
            accentMat={accentMat}
            gloveMat={gloveMat}
            side={1}
            gloved={isMj}
            handAccessory={runtime.status === 'coffee' ? <CoffeeHandCup /> : undefined}
          />
        </group>

        <group ref={headRef} position={[0, 0.525, 0]}>
          <AgentHumanHead
            designId={avatarDesign.id}
            skinMat={skinMat}
            hairMat={hairMat}
            accentMat={accentMat}
            trimMat={trimMat}
            eyeWhiteMat={eyeWhiteMat}
            eyeMat={eyeMat}
            cheekMat={cheekMat}
            noseMat={noseMat}
            outlineColor={OUTLINE_COLOR}
          />
        </group>

        {speechVariant && (
          <ConversationSpeechBubble
            variant={speechVariant}
            text={speechVariant === 'peer' ? peerBubbleText : undefined}
            streaming={peerSpeech.streaming}
          />
        )}
        {showThinkingAura && <AgentThinkingAura />}
      </group>

      <AgentRoleLogo logoUrl={definition.logoUrl} accentColor={definition.accentColor} />

      <AgentLabel
        name={definition.name}
        role={definition.role}
        modelId={definition.modelId}
        status={status}
        socialChat={socialChat}
        userChatMode={isUserChatAgent && runtime.status === 'chatting' ? userChatMode : 'off'}
        accentColor={definition.accentColor}
        selected={isSelected}
      />
      </group>
    </group>
  );
}

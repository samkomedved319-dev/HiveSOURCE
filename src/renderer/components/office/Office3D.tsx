import React, { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, ContactShadows } from '@react-three/drei'
import type { Group, Mesh } from 'three'
import type { HiveSwarmEvent } from '../../types'

export type AgentMood = 'idle' | 'thinking' | 'searching' | 'talking' | 'coding' | 'done'

export type FloorAgent = {
  id: string
  name: string
  color: string
  shirt: string
  pants: string
  hair: string
  job: string
  desk: [number, number, number]
  meet: [number, number, number]
}

export const FLOOR_CREW: FloorAgent[] = [
  { id: 'scout', name: 'Scout', color: '#5B8DEF', shirt: '#1e3a5f', pants: '#0f172a', hair: '#1a1a1a', job: 'search', desk: [-7.2, 0, -2.6], meet: [6.2, 0, -3.2] },
  { id: 'athena', name: 'Athena', color: '#38BDF8', shirt: '#0e4a6e', pants: '#1a1a2e', hair: '#3E2723', job: 'intel', desk: [-3.6, 0, -2.6], meet: [7.4, 0, -3.2] },
  { id: 'hive', name: 'Hive', color: '#F2C14E', shirt: '#5c4a16', pants: '#1a1712', hair: '#111', job: 'lead', desk: [0, 0, -2.6], meet: [6.8, 0, -2.1] },
  { id: 'pulse', name: 'Pulse', color: '#FB7185', shirt: '#6b1d32', pants: '#211', hair: '#4A148C', job: 'check', desk: [-7.2, 0, 1.8], meet: [5.6, 0, -2.1] },
  { id: 'apollo', name: 'Apollo', color: '#F97316', shirt: '#7c2d12', pants: '#3E2723', hair: '#1a1a1a', job: 'code', desk: [-3.6, 0, 1.8], meet: [8.0, 0, -2.1] },
  { id: 'critic', name: 'Critic', color: '#C084FC', shirt: '#3b0764', pants: '#1a1a2e', hair: '#2e1065', job: 'review', desk: [0, 0, 1.8], meet: [6.8, 0, -4.2] },
]

function Mat({
  color,
  opacity = 1,
  emissive = '#000',
  emissiveIntensity = 0,
}: {
  color: string
  opacity?: number
  emissive?: string
  emissiveIntensity?: number
}) {
  return (
    <meshLambertMaterial
      color={color}
      transparent={opacity < 1}
      opacity={opacity}
      emissive={emissive}
      emissiveIntensity={emissiveIntensity}
    />
  )
}

function Box({
  args,
  position,
  rotation,
  color,
  opacity = 1,
  emissive,
  emissiveIntensity = 0,
  cast = true,
  receive = true,
}: {
  args: [number, number, number]
  position?: [number, number, number]
  rotation?: [number, number, number]
  color: string
  opacity?: number
  emissive?: string
  emissiveIntensity?: number
  cast?: boolean
  receive?: boolean
}) {
  return (
    <mesh position={position} rotation={rotation} castShadow={cast} receiveShadow={receive}>
      <boxGeometry args={args} />
      <Mat color={color} opacity={opacity} emissive={emissive} emissiveIntensity={emissiveIntensity} />
    </mesh>
  )
}

function Chair({ position, rotY = 0 }: { position: [number, number, number]; rotY?: number }) {
  const [x, y, z] = position
  return (
    <group position={[x, y, z]} rotation={[0, rotY, 0]}>
      <Box args={[0.38, 0.05, 0.38]} position={[0, 0.42, 0]} color="#2a241c" />
      <Box args={[0.38, 0.34, 0.05]} position={[0, 0.6, 0.18]} color="#2a241c" />
      {[-0.12, 0.12].map((ox) =>
        [-0.12, 0.12].map((oz) => <Box key={ox + oz} args={[0.04, 0.4, 0.04]} position={[ox, 0.2, oz]} color="#6b5a2a" cast={false} />)
      )}
    </group>
  )
}

function Desk({ position, accent, live }: { position: [number, number, number]; accent: string; live: boolean }) {
  const [x, , z] = position
  return (
    <group>
      <Box args={[1.7, 0.07, 0.95]} position={[x, 0.72, z]} color="#c4b59a" />
      {[-0.72, 0.72].map((ox) =>
        [-0.38, 0.38].map((oz) => <Box key={ox + oz} args={[0.07, 0.68, 0.07]} position={[x + ox, 0.34, z + oz]} color="#8a7a5c" />)
      )}
      <Box args={[0.95, 0.58, 0.05]} position={[x, 1.12, z - 0.28]} color="#111" />
      <Box args={[0.82, 0.46, 0.02]} position={[x, 1.12, z - 0.25]} color="#0b0c0e" emissive={accent} emissiveIntensity={live ? 1.6 : 0.25} />
      <Box args={[0.42, 0.03, 0.22]} position={[x, 0.77, z + 0.12]} color="#1b1914" />
      <Box args={[0.12, 0.02, 0.18]} position={[x + 0.38, 0.77, z + 0.18]} color="#333" />
      <Chair position={[x, 0, z + 0.72]} />
      {live && <pointLight position={[x, 1.3, z]} color={accent} intensity={0.55} distance={3.2} />}
    </group>
  )
}

function VoxelPerson({
  agent,
  mood,
  meeting,
}: {
  agent: FloorAgent
  mood: AgentMood
  meeting: boolean
}) {
  const g = useRef<Group>(null)
  const lLeg = useRef<Mesh>(null)
  const rLeg = useRef<Mesh>(null)
  const target = meeting && mood !== 'idle' ? agent.meet : agent.desk
  const walking = useRef(false)

  useFrame((state) => {
    const node = g.current
    if (!node) return
    const dx = target[0] - node.position.x
    const dz = target[2] - node.position.z
    const dist = Math.hypot(dx, dz)
    walking.current = dist > 0.12
    const k = Math.min(1, state.clock.getDelta() * 2.4)
    if (dist > 0.05) {
      node.position.x += dx * k
      node.position.z += dz * k
      node.rotation.y = Math.atan2(dx, dz)
    }
    const t = state.clock.elapsedTime
    if (lLeg.current && rLeg.current) {
      const swing = walking.current ? Math.sin(t * 10) * 0.45 : 0
      lLeg.current.rotation.x = swing
      rLeg.current.rotation.x = -swing
    }
    node.position.y = walking.current ? Math.abs(Math.sin(t * 10)) * 0.04 : mood === 'idle' ? 0 : Math.sin(t * 5) * 0.02
  })

  const skin = '#deb887'
  return (
    <group ref={g} position={agent.desk}>
      <mesh ref={lLeg} position={[-0.08, 0.2, 0]} castShadow>
        <boxGeometry args={[0.1, 0.4, 0.1]} />
        <meshLambertMaterial color={agent.pants} />
      </mesh>
      <mesh ref={rLeg} position={[0.08, 0.2, 0]} castShadow>
        <boxGeometry args={[0.1, 0.4, 0.1]} />
        <meshLambertMaterial color={agent.pants} />
      </mesh>
      <Box args={[0.11, 0.05, 0.16]} position={[-0.08, 0.025, 0]} color="#222" />
      <Box args={[0.11, 0.05, 0.16]} position={[0.08, 0.025, 0]} color="#222" />
      <Box args={[0.28, 0.32, 0.16]} position={[0, 0.58, 0]} color={agent.shirt} />
      <Box args={[0.18, 0.04, 0.1]} position={[0, 0.75, 0]} color="#fff" />
      <Box args={[0.08, 0.28, 0.08]} position={[-0.2, 0.5, 0]} color={agent.shirt} />
      <Box args={[0.08, 0.28, 0.08]} position={[0.2, 0.5, 0]} color={agent.shirt} />
      <Box args={[0.2, 0.2, 0.2]} position={[0, 0.88, 0]} color={skin} />
      <Box args={[0.22, 0.08, 0.22]} position={[0, 0.98, -0.01]} color={agent.hair} />
      <Box args={[0.03, 0.03, 0.01]} position={[-0.05, 0.9, 0.11]} color="#fff" emissive="#fff" emissiveIntensity={0.4} />
      <Box args={[0.03, 0.03, 0.01]} position={[0.05, 0.9, 0.11]} color="#fff" emissive="#fff" emissiveIntensity={0.4} />
      <Box args={[0.08, 0.04, 0.08]} position={[0.16, 0.42, 0.02]} color={agent.color} emissive={agent.color} emissiveIntensity={mood === 'idle' ? 0.3 : 1.4} />
    </group>
  )
}

function Building() {
  return (
    <group>
      <Box args={[26, 0.14, 20]} position={[0, -0.07, 0]} color="#d8d4cc" receive cast={false} />
      <Box args={[12, 0.03, 10]} position={[-3.2, 0.02, 0]} color="#c9c3b8" receive cast={false} />
      {[
        [0, -9.9, 26, 3.6, 0.08],
        [0, 9.9, 26, 3.6, 0.08],
        [-12.95, 0, 0.08, 3.6, 20],
        [12.95, 0, 0.08, 3.6, 20],
      ].map(([x, z, w, h, d], i) => (
        <Box key={i} args={[w, h, d]} position={[x, h / 2, z]} color="#bbccdd" opacity={0.12} cast={false} />
      ))}
      {[-12.9, 12.9].map((x) =>
        [-9.9, 9.9].map((z) => <Box key={x + z} args={[0.1, 3.6, 0.1]} position={[x, 1.8, z]} color="#9aabbc" />)
      )}
      <Box args={[26, 0.08, 20]} position={[0, 3.72, 0]} color="#0A1628" opacity={0.55} cast={false} />
      {[-2, -1, 0, 1, 2].map((i) =>
        [-1, 0, 1].map((j) => (
          <group key={`${i}${j}`}>
            <Box args={[3, 0.04, 1]} position={[i * 4.4, 3.66, j * 4.8]} color="#F0F4FF" emissive="#F0F4FF" emissiveIntensity={0.5} cast={false} />
            <pointLight position={[i * 4.4, 3.4, j * 4.8]} intensity={0.22} distance={9} color="#fff8e8" />
          </group>
        ))
      )}
      <Box args={[0.08, 3.2, 5.6]} position={[5.1, 1.6, -3]} color="#bbccdd" opacity={0.14} />
      <Box args={[1.9, 3.2, 0.08]} position={[6.1, 1.6, -0.25]} color="#bbccdd" opacity={0.14} />
      <Box args={[1.9, 3.2, 0.08]} position={[9.5, 1.6, -0.25]} color="#bbccdd" opacity={0.14} />
      <Box args={[3.8, 0.08, 1.55]} position={[7.4, 0.72, -3]} color="#dde4ec" />
      {[
        [6.0, -4.1],
        [7.4, -4.1],
        [8.8, -4.1],
        [6.0, -1.9],
        [7.4, -1.9],
        [8.8, -1.9],
      ].map(([x, z], i) => (
        <Chair key={i} position={[x, 0, z]} rotY={z < -3 ? 0 : Math.PI} />
      ))}
      <Box args={[2.5, 1.1, 0.04]} position={[7.4, 2.15, -5.65]} color="#fafafa" />
      <Box args={[0.55, 1.15, 0.55]} position={[-11.2, 0.58, 7.6]} color="#14532d" />
      <Box args={[0.85, 0.35, 0.85]} position={[-11.2, 1.28, 7.6]} color="#166534" />
      <Box args={[0.55, 1.15, 0.55]} position={[11.2, 0.58, 7.6]} color="#14532d" />
      <Box args={[0.85, 0.35, 0.85]} position={[11.2, 1.28, 7.6]} color="#166534" />
      <Box args={[1.8, 0.28, 0.7]} position={[8.6, 0.28, 5.4]} color="#3a3226" />
      <Box args={[0.7, 0.55, 0.7]} position={[7.7, 0.55, 5.4]} color="#1b1914" />
      <Box args={[0.7, 0.55, 0.7]} position={[9.5, 0.55, 5.4]} color="#1b1914" />
      <Box args={[1.1, 1.7, 0.35]} position={[-11.4, 0.85, -7.4]} color="#2a241c" />
    </group>
  )
}

function LiveFloor({
  moods,
  meeting,
}: {
  moods: Record<string, AgentMood>
  meeting: boolean
}) {
  return (
    <>
      <Building />
      {FLOOR_CREW.map((a) => {
        const mood = moods[a.id] || moods[a.name.toLowerCase()] || 'idle'
        return (
          <React.Fragment key={a.id}>
            <Desk position={a.desk} accent={a.color} live={mood !== 'idle'} />
            <VoxelPerson agent={a} mood={mood} meeting={meeting} />
          </React.Fragment>
        )
      })}
      <ContactShadows position={[0, 0.01, 0]} opacity={0.35} scale={28} blur={2.4} far={8} />
    </>
  )
}

export default function Office3D({
  moods,
  meeting,
}: {
  moods: Record<string, AgentMood>
  bubbles: Record<string, string>
  meeting: boolean
}) {
  return (
    <Canvas
      shadows
      camera={{ position: [16, 14, 18], fov: 32, near: 0.1, far: 200 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: false }}
      style={{ width: '100%', height: '100%', display: 'block' }}
    >
      <color attach="background" args={['#0b0c0e']} />
      <fog attach="fog" args={['#0b0c0e', 28, 70]} />
      <ambientLight intensity={0.55} />
      <hemisphereLight args={['#dde8f0', '#1a1712', 0.35]} />
      <directionalLight
        position={[14, 22, 10]}
        intensity={1.15}
        color="#fff4d6"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-18}
        shadow-camera-right={18}
        shadow-camera-top={18}
        shadow-camera-bottom={-18}
      />
      <LiveFloor moods={moods} meeting={meeting} />
      <OrbitControls
        enablePan={false}
        minPolarAngle={0.7}
        maxPolarAngle={1.15}
        minDistance={14}
        maxDistance={36}
        target={[0, 0.8, 0]}
      />
    </Canvas>
  )
}

export function moodFromEvent(ev: HiveSwarmEvent): AgentMood {
  if (ev.type === 'function_call.started') return 'searching'
  if (ev.type === 'inference.started' || ev.type === 'inference.stream') {
    return ev.producerName === 'Apollo' ? 'coding' : 'thinking'
  }
  if (ev.type === 'model.answer') return 'talking'
  return 'idle'
}

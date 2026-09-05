import React, { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Html, ContactShadows } from '@react-three/drei'
import type { Group } from 'three'
import type { HiveSwarmEvent } from '../../types'

export type AgentMood = 'idle' | 'thinking' | 'searching' | 'talking' | 'coding' | 'done'

export type FloorAgent = {
  id: string
  name: string
  color: string
  job: string
  desk: [number, number, number]
  meet: [number, number, number]
}

export const FLOOR_CREW: FloorAgent[] = [
  { id: 'scout', name: 'Scout', color: '#5B8DEF', job: 'search', desk: [-6.2, 0, -2.4], meet: [-0.9, 0, 0.2] },
  { id: 'athena', name: 'Athena', color: '#38BDF8', job: 'intel', desk: [-6.2, 0, 1.4], meet: [-0.4, 0, 1.1] },
  { id: 'hive', name: 'Hive', color: '#F2C14E', job: 'lead', desk: [0, 0, -4.2], meet: [0, 0, 0] },
  { id: 'pulse', name: 'Pulse', color: '#FB7185', job: 'check', desk: [2.2, 0, -4.2], meet: [0.8, 0, 0.6] },
  { id: 'apollo', name: 'Apollo', color: '#F97316', job: 'code', desk: [6.2, 0, -2.2], meet: [1.1, 0, -0.2] },
  { id: 'critic', name: 'Critic', color: '#C084FC', job: 'review', desk: [6.2, 0, 2.2], meet: [0.5, 0, 1.4] },
]

function Box({
  args,
  position,
  rotation,
  color,
  opacity = 1,
  emissive,
  emissiveIntensity = 0,
}: {
  args: [number, number, number]
  position?: [number, number, number]
  rotation?: [number, number, number]
  color: string
  opacity?: number
  emissive?: string
  emissiveIntensity?: number
}) {
  return (
    <mesh position={position} rotation={rotation} castShadow receiveShadow>
      <boxGeometry args={args} />
      <meshStandardMaterial
        color={color}
        transparent={opacity < 1}
        opacity={opacity}
        emissive={emissive || '#000'}
        emissiveIntensity={emissiveIntensity}
        roughness={0.55}
        metalness={0.12}
      />
    </mesh>
  )
}

function Desk({ position, accent, live }: { position: [number, number, number]; accent: string; live: boolean }) {
  const [x, y, z] = position
  return (
    <group>
      <Box args={[1.6, 0.08, 0.9]} position={[x, y + 0.72, z]} color="#2a261f" />
      <Box args={[0.08, 0.72, 0.08]} position={[x - 0.7, y + 0.36, z - 0.35]} color="#1b1814" />
      <Box args={[0.08, 0.72, 0.08]} position={[x + 0.7, y + 0.36, z - 0.35]} color="#1b1814" />
      <Box args={[0.08, 0.72, 0.08]} position={[x - 0.7, y + 0.36, z + 0.35]} color="#1b1814" />
      <Box args={[0.08, 0.72, 0.08]} position={[x + 0.7, y + 0.36, z + 0.35]} color="#1b1814" />
      <Box args={[0.9, 0.55, 0.06]} position={[x, y + 1.12, z - 0.18]} color="#111" />
      <Box
        args={[0.78, 0.42, 0.02]}
        position={[x, y + 1.12, z - 0.14]}
        color="#0b0c0e"
        emissive={accent}
        emissiveIntensity={live ? 1.4 : 0.18}
      />
      <Box args={[0.5, 0.42, 0.45]} position={[x, y + 0.22, z + 0.55]} color="#1a1713" />
    </group>
  )
}

function RoomGlass({ position, args }: { position: [number, number, number]; args: [number, number, number] }) {
  return <Box args={args} position={position} color="#F2C14E" opacity={0.08} />
}

function VoxelAgent({
  agent,
  mood,
  bubble,
  meeting,
}: {
  agent: FloorAgent
  mood: AgentMood
  bubble?: string
  meeting: boolean
}) {
  const ref = useRef<Group>(null)
  const target = meeting && mood !== 'idle' ? agent.meet : agent.desk
  const walking = useRef(false)

  useFrame((_, dt) => {
    const g = ref.current
    if (!g) return
    const tx = target[0]
    const tz = target[2]
    const dx = tx - g.position.x
    const dz = tz - g.position.z
    const dist = Math.hypot(dx, dz)
    walking.current = dist > 0.08
    if (dist > 0.04) {
      g.position.x += dx * Math.min(1, dt * 2.2)
      g.position.z += dz * Math.min(1, dt * 2.2)
      g.rotation.y = Math.atan2(dx, dz)
    }
    const t = performance.now() / 1000
    const bob = walking.current ? Math.abs(Math.sin(t * 10)) * 0.08 : mood === 'idle' ? Math.sin(t * 2) * 0.015 : Math.sin(t * 6) * 0.03
    g.position.y = 0.02 + bob
  })

  return (
    <group ref={ref} position={agent.desk}>
      <mesh position={[0, 0.55, 0]} castShadow>
        <capsuleGeometry args={[0.16, 0.38, 4, 8]} />
        <meshStandardMaterial color={agent.color} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.95, 0]} castShadow>
        <sphereGeometry args={[0.16, 12, 12]} />
        <meshStandardMaterial color="#f3e6c8" />
      </mesh>
      <mesh position={[0, 1.08, 0]}>
        <sphereGeometry args={[0.12, 10, 10]} />
        <meshStandardMaterial color="#1a1713" />
      </mesh>
      <pointLight position={[0, 1.2, 0]} color={agent.color} intensity={mood === 'idle' ? 0.2 : 1.1} distance={3} />
      <Html position={[0, 1.45, 0]} center distanceFactor={10} style={{ pointerEvents: 'none' }}>
        <div style={{ textAlign: 'center', fontFamily: 'Outfit, sans-serif' }}>
          {bubble && mood !== 'idle' && (
            <div
              style={{
                background: '#1b1914',
                border: '1px solid rgba(242,193,78,.45)',
                color: '#f4f1ea',
                fontSize: 11,
                padding: '6px 8px',
                borderRadius: 8,
                width: 140,
                marginBottom: 4,
                lineHeight: 1.35,
              }}
            >
              {bubble}
              <span style={{ display: 'inline-block', width: 5, height: 10, background: agent.color, marginLeft: 4, animation: 'office-type .7s steps(1) infinite' }} />
            </div>
          )}
          <div style={{ color: '#f4f1ea', fontSize: 11, fontWeight: 700, textShadow: '0 1px 4px #000' }}>{agent.name}</div>
          <div style={{ color: agent.color, fontSize: 10 }}>{mood === 'idle' ? agent.job : mood}</div>
        </div>
      </Html>
    </group>
  )
}

function Furniture() {
  return (
    <>
      <Box args={[20, 0.12, 16]} position={[0, -0.06, 0]} color="#1a1712" />
      <Box args={[20, 2.4, 0.12]} position={[0, 1.2, -8]} color="#241f18" />
      <Box args={[0.12, 2.4, 16]} position={[-10, 1.2, 0]} color="#241f18" />
      <Box args={[0.12, 2.4, 16]} position={[10, 1.2, 0]} color="#241f18" />
      <RoomGlass position={[-6.4, 1.1, -0.6]} args={[5.6, 0.04, 6.4]} />
      <RoomGlass position={[6.4, 1.1, 0]} args={[5.6, 0.04, 7]} />
      <RoomGlass position={[0, 1.1, 0.2]} args={[5.2, 0.04, 4.2]} />
      <Box args={[3.2, 0.08, 1.6]} position={[0, 0.7, 0.2]} color="#3a3226" />
      <Box args={[3.1, 0.04, 1.5]} position={[0, 0.76, 0.2]} color="#F2C14E" opacity={0.35} emissive="#F2C14E" emissiveIntensity={0.4} />
      {[-1.1, 0, 1.1].map((x) => (
        <Box key={x} args={[0.42, 0.42, 0.42]} position={[x, 0.22, 1.15]} color="#1f1b16" />
      ))}
      <Box args={[0.5, 1.1, 0.5]} position={[-8.6, 0.55, 5.4]} color="#14532d" />
      <Box args={[0.7, 0.3, 0.7]} position={[-8.6, 1.2, 5.4]} color="#166534" />
      <Box args={[0.5, 1.1, 0.5]} position={[8.6, 0.55, 5.4]} color="#14532d" />
      <Box args={[0.7, 0.3, 0.7]} position={[8.6, 1.2, 5.4]} color="#166534" />
      <Box args={[1.4, 1.6, 0.4]} position={[-8.8, 0.8, -6.4]} color="#2a241c" />
      <Html position={[-6.4, 2.15, -5.2]} center>
        <div style={{ color: '#F2C14E', fontSize: 11, letterSpacing: '.16em', fontWeight: 700 }}>SEARCH LAB</div>
      </Html>
      <Html position={[0, 2.15, -2.2]} center>
        <div style={{ color: '#F2C14E', fontSize: 11, letterSpacing: '.16em', fontWeight: 700 }}>TALK TABLE</div>
      </Html>
      <Html position={[6.4, 2.15, -5.2]} center>
        <div style={{ color: '#F2C14E', fontSize: 11, letterSpacing: '.16em', fontWeight: 700 }}>DEV DESKS</div>
      </Html>
      <Html position={[6.2, 2.15, 4.6]} center>
        <div style={{ color: '#F2C14E', fontSize: 11, letterSpacing: '.16em', fontWeight: 700 }}>REVIEW</div>
      </Html>
    </>
  )
}

function LiveFloor({
  moods,
  bubbles,
  meeting,
}: {
  moods: Record<string, AgentMood>
  bubbles: Record<string, string>
  meeting: boolean
}) {
  return (
    <>
      <Furniture />
      {FLOOR_CREW.map((a) => {
        const mood = moods[a.id] || moods[a.name.toLowerCase()] || 'idle'
        return (
          <React.Fragment key={a.id}>
            <Desk position={a.desk} accent={a.color} live={mood !== 'idle'} />
            <VoxelAgent agent={a} mood={mood} bubble={bubbles[a.id] || bubbles[a.name.toLowerCase()]} meeting={meeting} />
          </React.Fragment>
        )
      })}
      <ContactShadows position={[0, 0, 0]} opacity={0.45} scale={22} blur={2.2} />
    </>
  )
}

export default function Office3D({
  moods,
  bubbles,
  meeting,
}: {
  moods: Record<string, AgentMood>
  bubbles: Record<string, string>
  meeting: boolean
}) {
  const lights = useMemo(() => true, [])
  return (
    <Canvas shadows camera={{ position: [13, 11, 13], fov: 38 }} dpr={[1, 1.6]} gl={{ antialias: true, alpha: false }}>
      <color attach="background" args={['#0b0c0e']} />
      <ambientLight intensity={0.35} />
      {lights && (
        <>
          <directionalLight position={[8, 14, 6]} intensity={1.15} color="#fff4d6" castShadow />
          <pointLight position={[0, 4, 0]} intensity={0.8} color="#F2C14E" distance={16} />
          <pointLight position={[-6, 3, -2]} intensity={0.5} color="#5B8DEF" distance={8} />
          <pointLight position={[6, 3, 0]} intensity={0.5} color="#F97316" distance={8} />
        </>
      )}
      <LiveFloor moods={moods} bubbles={bubbles} meeting={meeting} />
      <OrbitControls
        enablePan
        minPolarAngle={0.55}
        maxPolarAngle={1.2}
        minDistance={8}
        maxDistance={24}
        target={[0, 0.4, 0]}
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

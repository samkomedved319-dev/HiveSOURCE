import React, { useEffect, useMemo, useRef, Suspense, Component, type ReactNode } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, useGLTF, Html } from '@react-three/drei'
import type { Group, Mesh, Object3D, WebGLRenderer } from 'three'
import { FLOOR_CREW, type AgentMood, type FloorAgent } from './crew'

export { FLOOR_CREW }
export type { AgentMood, FloorAgent }

function asset(file: string) {
  const raw = import.meta.env.BASE_URL || './'
  const base = raw.endsWith('/') ? raw : `${raw}/`
  return `${base}office-assets/models/furniture/${file}`
}

const MODELS = [
  'desk.glb',
  'chairDesk.glb',
  'computerScreen.glb',
  'tableRound.glb',
  'tableCoffee.glb',
  'loungeSofa.glb',
  'pottedPlant.glb',
  'plantSmall1.glb',
  'lampRoundFloor.glb',
  'kitchenCoffeeMachine.glb',
  'kitchenFridgeSmall.glb',
  'bookcaseClosed.glb',
  'chairModernCushion.glb',
] as const

// Best-effort preload so first paint is fast. Failures are fine —
// SafePiece falls back to plain boxes per model.
try {
  for (const f of MODELS) {
    try {
      useGLTF.preload(asset(f))
    } catch {}
  }
} catch {}

// Boundary that lives INSIDE <Canvas>. The outer DOM ErrorBoundary cannot
// catch reconciler errors from react-three-fiber, which is exactly how a
// single missing GLB used to turn the whole view black.
class CanvasErrorBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { hasError: boolean }> {
  constructor(props: { fallback: ReactNode; children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  componentDidCatch(err: unknown) {
    console.warn('[Office3D] inner scene error, using fallback furniture:', err)
  }
  render() {
    return this.state.hasError ? this.props.fallback : this.props.children
  }
}

class PieceErrorBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { hasError: boolean }> {
  constructor(props: { fallback: ReactNode; children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  componentDidCatch(err: unknown) {
    console.warn('[Office3D] model failed, using box fallback:', err)
  }
  render() {
    return this.state.hasError ? this.props.fallback : this.props.children
  }
}

function PieceInner({
  file,
  position,
  rotation = [0, 0, 0],
  scale = 1,
}: {
  file: (typeof MODELS)[number]
  position: [number, number, number]
  rotation?: [number, number, number]
  scale?: number
}) {
  const gltf = useGLTF(asset(file))
  const obj = useMemo(() => gltf.scene.clone(true), [gltf.scene])
  useEffect(() => {
    obj.traverse((n: Object3D) => {
      const m = n as Mesh
      if (m.isMesh) {
        m.castShadow = true
        m.receiveShadow = true
      }
    })
  }, [obj])
  return <primitive object={obj} position={position} rotation={rotation} scale={scale} />
}

// One model, isolated: a 404 / corrupt GLB degrades to a box desk piece,
// never to a black canvas.
function Piece(props: {
  file: (typeof MODELS)[number]
  position: [number, number, number]
  rotation?: [number, number, number]
  scale?: number
}) {
  const { position } = props
  return (
    <PieceErrorBoundary
      fallback={
        <mesh position={position} castShadow receiveShadow>
          <boxGeometry args={[1.6, 0.7, 0.8]} />
          <meshLambertMaterial color="#e6be8a" />
        </mesh>
      }
    >
      <Suspense fallback={null}>
        <PieceInner {...props} />
      </Suspense>
    </PieceErrorBoundary>
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
      <meshLambertMaterial
        color={color}
        transparent={opacity < 1}
        opacity={opacity}
        emissive={emissive || '#000'}
        emissiveIntensity={emissiveIntensity}
      />
    </mesh>
  )
}

function SafeLabel({ agent, isWorking, mood }: { agent: FloorAgent; isWorking: boolean; mood: string }) {
  return (
    <PieceErrorBoundary fallback={null}>
      <Suspense fallback={null}>
        <Html position={[0, 1.35, 0]} center distanceFactor={14} zIndexRange={[40, 0]}>
          <div
            style={{
              background: 'rgba(15, 12, 9, 0.88)',
              border: `1.5px solid ${isWorking ? agent.color : '#554636'}`,
              borderRadius: 8,
              padding: '3px 8px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              pointerEvents: 'none',
              boxShadow: isWorking ? `0 0 10px ${agent.color}80` : '0 4px 8px rgba(0,0,0,0.5)',
              transform: 'scale(0.9)',
              whiteSpace: 'nowrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: agent.color,
                  boxShadow: `0 0 6px ${agent.color}`,
                }}
              />
              <span style={{ color: '#fff', fontWeight: 800, fontSize: 11, letterSpacing: '.02em' }}>
                {agent.name}
              </span>
            </div>
            <span
              style={{
                color: isWorking ? agent.color : '#b0a08e',
                fontSize: 9,
                fontWeight: 600,
                textTransform: 'uppercase',
              }}
            >
              {isWorking ? mood : agent.job}
            </span>
          </div>
        </Html>
      </Suspense>
    </PieceErrorBoundary>
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
  const body = useRef<Group>(null)
  const lLeg = useRef<Mesh>(null)
  const rLeg = useRef<Mesh>(null)
  const lArm = useRef<Mesh>(null)
  const rArm = useRef<Mesh>(null)
  const head = useRef<Mesh>(null)
  const last = useRef(0)
  const sit = useRef(0)

  const deskSit: [number, number, number] = [agent.desk[0], 0, agent.desk[2] + 0.55]
  const target = meeting && mood !== 'idle' && mood !== 'done' ? agent.meet : deskSit
  const wantSit = mood === 'idle' || mood === 'coding' || mood === 'thinking' || mood === 'talking' || mood === 'done'
  const isWorking = mood !== 'idle' || meeting

  useFrame((state) => {
    const node = g.current
    if (!node) return
    const t = state.clock.elapsedTime
    const dt = Math.min(0.05, Math.max(0.001, t - last.current))
    last.current = t
    const dx = target[0] - node.position.x
    const dz = target[2] - node.position.z
    const dist = Math.hypot(dx, dz)
    const walking = dist > 0.1
    if (dist > 0.04) {
      const k = 1 - Math.pow(0.012, dt)
      node.position.x += dx * k
      node.position.z += dz * k
      node.rotation.y = Math.atan2(dx, dz)
    } else if (!walking) {
      const face = meeting && mood !== 'idle' ? 0 : Math.PI
      node.rotation.y += (face - node.rotation.y) * Math.min(1, dt * 6)
    }
    const sitTo = !walking && wantSit ? 1 : 0
    sit.current += (sitTo - sit.current) * Math.min(1, dt * 5)
    if (lLeg.current && rLeg.current) {
      if (walking) {
        const swing = Math.sin(t * 11) * 0.55
        lLeg.current.rotation.x = swing
        rLeg.current.rotation.x = -swing
      } else {
        lLeg.current.rotation.x = sit.current * 0.9
        rLeg.current.rotation.x = sit.current * 0.9
      }
    }
    if (lArm.current && rArm.current) {
      if (walking) {
        lArm.current.rotation.x = Math.sin(t * 11) * 0.4
        rArm.current.rotation.x = -Math.sin(t * 11) * 0.4
      } else if (mood === 'coding' || mood === 'thinking' || mood === 'searching') {
        lArm.current.rotation.x = 0.85
        rArm.current.rotation.x = 0.7 + Math.sin(t * 14) * 0.35
      } else if (mood === 'talking') {
        rArm.current.rotation.x = 0.15 + Math.sin(t * 5) * 0.4
      } else {
        lArm.current.rotation.x = sit.current * 0.7
        rArm.current.rotation.x = sit.current * 0.7
      }
    }
    if (head.current) {
      head.current.rotation.x = mood === 'thinking' ? -0.15 : mood === 'talking' ? Math.sin(t * 6) * 0.08 : 0
      head.current.rotation.y = mood === 'searching' ? Math.sin(t * 1.4) * 0.35 : 0
    }
    if (body.current) body.current.position.y = -sit.current * 0.16
    node.position.y = walking ? Math.abs(Math.sin(t * 11)) * 0.045 : 0
  })

  return (
    <group ref={g} position={deskSit}>
      <group ref={body}>
        <mesh ref={lLeg} position={[-0.08, 0.2, 0]} castShadow>
          <boxGeometry args={[0.1, 0.4, 0.1]} />
          <meshLambertMaterial color={agent.pants} />
        </mesh>
        <mesh ref={rLeg} position={[0.08, 0.2, 0]} castShadow>
          <boxGeometry args={[0.1, 0.4, 0.1]} />
          <meshLambertMaterial color={agent.pants} />
        </mesh>
        <Box args={[0.3, 0.34, 0.18]} position={[0, 0.58, 0]} color={agent.shirt} />
        <mesh ref={lArm} position={[-0.2, 0.62, 0]} castShadow>
          <boxGeometry args={[0.08, 0.3, 0.08]} />
          <meshLambertMaterial color={agent.shirt} />
        </mesh>
        <mesh ref={rArm} position={[0.2, 0.62, 0]} castShadow>
          <boxGeometry args={[0.08, 0.3, 0.08]} />
          <meshLambertMaterial color={agent.shirt} />
        </mesh>
        <mesh ref={head} position={[0, 0.92, 0]} castShadow>
          <sphereGeometry args={[0.13, 18, 16]} />
          <meshLambertMaterial color="#deb887" />
        </mesh>
        <mesh position={[0, 1.02, -0.02]} castShadow>
          <sphereGeometry args={[0.13, 14, 10]} />
          <meshLambertMaterial color={agent.hair} />
        </mesh>
        <Box args={[0.07, 0.04, 0.07]} position={[0.16, 0.44, 0.02]} color={agent.color} emissive={agent.color} emissiveIntensity={mood === 'idle' ? 0.2 : 1.2} />

        {/* 3D Floating Name & Status Badge (isolated so label failure can't black the scene) */}
        <SafeLabel agent={agent} isWorking={isWorking} mood={mood} />
      </group>
    </group>
  )
}

function ClawOffice({ moods, meeting }: { moods: Record<string, AgentMood>; meeting: boolean }) {
  return (
    <group>
      {/* Warm natural wood parquet floor */}
      <Box args={[22, 0.12, 16]} position={[0, -0.06, 0]} color="#b58750" receive cast={false} />
      {/* Modern architectural walls */}
      <Box args={[22, 3.2, 0.12]} position={[0, 1.6, -8]} color="#2d261e" />
      <Box args={[22, 3.2, 0.12]} position={[0, 1.6, 8]} color="#2d261e" />
      <Box args={[0.12, 3.2, 16]} position={[-11, 1.6, 0]} color="#2d261e" />
      <Box args={[0.12, 3.2, 16]} position={[11, 1.6, 0]} color="#2d261e" />
      <Box args={[22, 0.08, 16]} position={[0, 3.24, 0]} color="#1a1612" />

      {/* 6 Desks for Scout, Athena, Hive, Pulse, Apollo, Critic */}
      {FLOOR_CREW.map((a) => (
        <group key={a.id}>
          <Piece file="desk.glb" position={a.desk} scale={1} />
          <Piece file="chairDesk.glb" position={[a.desk[0], 0, a.desk[2] + 0.7]} rotation={[0, Math.PI, 0]} scale={1} />
          <Piece file="computerScreen.glb" position={[a.desk[0], 0.72, a.desk[2] - 0.15]} scale={1} />
        </group>
      ))}

      {/* Conference Round Table & Meeting Chairs */}
      <Piece file="tableRound.glb" position={[7.2, 0, -4.2]} scale={1.15} />
      <Piece file="chairModernCushion.glb" position={[6.2, 0, -4.9]} rotation={[0, 0.4, 0]} />
      <Piece file="chairModernCushion.glb" position={[8.2, 0, -4.9]} rotation={[0, -0.4, 0]} />
      <Piece file="chairModernCushion.glb" position={[6.2, 0, -3.5]} rotation={[0, 2.6, 0]} />
      <Piece file="chairModernCushion.glb" position={[8.2, 0, -3.5]} rotation={[0, -2.6, 0]} />

      {/* Office Lounge & Kitchen Breakout amenities */}
      <Piece file="loungeSofa.glb" position={[8.4, 0, 5.6]} rotation={[0, Math.PI, 0]} />
      <Piece file="tableCoffee.glb" position={[8.4, 0, 4.5]} />
      <Piece file="lampRoundFloor.glb" position={[9.8, 0, 5.8]} />
      <Piece file="pottedPlant.glb" position={[-10.2, 0, 6.8]} />
      <Piece file="plantSmall1.glb" position={[10.2, 0, -6.8]} />
      <Piece file="bookcaseClosed.glb" position={[-10.3, 0, -6.4]} />
      <Piece file="kitchenFridgeSmall.glb" position={[-10.2, 0, 4.4]} />
      <Piece file="kitchenCoffeeMachine.glb" position={[-9.2, 0, 4.4]} />

      {/* The 6 Voxel Agents */}
      {FLOOR_CREW.map((a) => {
        const mood = moods[a.id] || moods[a.name.toLowerCase()] || 'idle'
        return <VoxelPerson key={a.id} agent={a} mood={mood} meeting={meeting} />
      })}
    </group>
  )
}

function FallbackFurniture() {
  return (
    <group>
      {/* 6 Desks */}
      {FLOOR_CREW.map((a) => (
        <group key={a.id}>
          {/* Desk surface */}
          <Box args={[1.8, 0.08, 0.9]} position={[a.desk[0], 0.72, a.desk[2]]} color="#e6be8a" />
          {/* Legs */}
          <Box args={[0.08, 0.72, 0.08]} position={[a.desk[0] - 0.8, 0.36, a.desk[2] - 0.35]} color="#4a4237" />
          <Box args={[0.08, 0.72, 0.08]} position={[a.desk[0] + 0.8, 0.36, a.desk[2] - 0.35]} color="#4a4237" />
          <Box args={[0.08, 0.72, 0.08]} position={[a.desk[0] - 0.8, 0.36, a.desk[2] + 0.35]} color="#4a4237" />
          <Box args={[0.08, 0.72, 0.08]} position={[a.desk[0] + 0.8, 0.36, a.desk[2] + 0.35]} color="#4a4237" />
          {/* Monitor */}
          <Box args={[0.7, 0.45, 0.04]} position={[a.desk[0], 1.05, a.desk[2] - 0.2]} color="#1e222b" />
          <Box args={[0.06, 0.3, 0.06]} position={[a.desk[0], 0.88, a.desk[2] - 0.2]} color="#555" />
          {/* Chair */}
          <Box args={[0.5, 0.08, 0.5]} position={[a.desk[0], 0.46, a.desk[2] + 0.7]} color="#2d3748" />
          <Box args={[0.5, 0.5, 0.08]} position={[a.desk[0], 0.75, a.desk[2] + 0.92]} color="#2d3748" />
        </group>
      ))}
      {/* Conference Table */}
      <Box args={[2.4, 0.08, 2.4]} position={[7.2, 0.72, -4.2]} color="#d4a373" />
      <Box args={[0.3, 0.72, 0.3]} position={[7.2, 0.36, -4.2]} color="#4a4237" />
    </group>
  )
}

function FallbackOffice({ moods, meeting }: { moods: Record<string, AgentMood>; meeting: boolean }) {
  return (
    <group>
      <Box args={[22, 0.12, 16]} position={[0, -0.06, 0]} color="#b58750" receive cast={false} />
      <Box args={[22, 3.2, 0.12]} position={[0, 1.6, -8]} color="#2d261e" />
      <Box args={[22, 3.2, 0.12]} position={[0, 1.6, 8]} color="#2d261e" />
      <Box args={[0.12, 3.2, 16]} position={[-11, 1.6, 0]} color="#2d261e" />
      <Box args={[0.12, 3.2, 16]} position={[11, 1.6, 0]} color="#2d261e" />
      <FallbackFurniture />
      {FLOOR_CREW.map((a) => {
        const mood = moods[a.id] || moods[a.name.toLowerCase()] || 'idle'
        return <VoxelPerson key={a.id} agent={a} mood={mood} meeting={meeting} />
      })}
    </group>
  )
}

// Reports back only after real frames have rendered — NOT on context creation.
// This is what lets the overlay stay on the 2D floor until 3D is proven visible.
function ReadyProbe({ onReady }: { onReady: () => void }) {
  const frames = useRef(0)
  const done = useRef(false)
  useFrame(() => {
    if (done.current) return
    frames.current += 1
    if (frames.current >= 4) {
      done.current = true
      // Defer out of the frame loop into React land.
      setTimeout(onReady, 0)
    }
  })
  return null
}

export default function Office3D({
  moods,
  meeting,
  onReady,
  onError,
}: {
  moods: Record<string, AgentMood>
  bubbles?: Record<string, string>
  meeting: boolean
  onReady?: () => void
  onError?: (msg: string) => void
}) {
  const readyRef = useRef(false)
  const handleReady = () => {
    if (readyRef.current) return
    readyRef.current = true
    onReady?.()
  }

  return (
    <Canvas
      shadows
      camera={{ position: [10, 8, 12], fov: 40, near: 0.1, far: 80 }}
      dpr={[1, 1.25]}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance', failIfMajorPerformanceCaveat: false }}
      onCreated={({ gl }) => {
        try {
          gl.setClearColor('#c9a66b', 1)
          // Surface context loss directly on the canvas element so we can
          // report it even if the window-level listener misses it.
          const el = gl.domElement
          const onLost = (e: Event) => {
            e.preventDefault()
            console.warn('[Office3D] canvas context lost')
            try {
              onError?.('Graphics context was lost.')
            } catch {}
          }
          el.addEventListener('webglcontextlost', onLost, { once: true })
        } catch (err) {
          console.warn('[Office3D] onCreated failed:', err)
          try {
            onError?.('Could not initialise 3D.')
          } catch {}
        }
        // Deliberately NOT calling onReady here: a context can exist while
        // the scene is still black (models loading / failed). ReadyProbe
        // fires only after real frames render.
      }}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block', background: '#c9a66b' }}
    >
      <color attach="background" args={['#c9a66b']} />
      <ambientLight intensity={0.9} />
      <hemisphereLight args={['#fff4d6', '#3a3226', 0.5]} />
      <directionalLight
        position={[8, 14, 6]}
        intensity={1.2}
        color="#ffe7a8"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <CanvasErrorBoundary fallback={<FallbackOffice moods={moods} meeting={meeting} />}>
        <Suspense fallback={<FallbackOffice moods={moods} meeting={meeting} />}>
          <ClawOffice moods={moods} meeting={meeting} />
        </Suspense>
      </CanvasErrorBoundary>
      <ReadyProbe onReady={handleReady} />
      <OrbitControls enablePan={false} minPolarAngle={0.6} maxPolarAngle={1.2} minDistance={8} maxDistance={22} target={[0, 0.6, 0]} />
    </Canvas>
  )
}

// Re-export for callers that reference the WebGLRenderer type only.
export type { WebGLRenderer }

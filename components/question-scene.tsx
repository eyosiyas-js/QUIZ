"use client"

import { useRef } from "react"
import { useFrame } from "@react-three/fiber"
import { Float } from "@react-three/drei"
import { useSpring, animated } from "@react-spring/three"
import * as THREE from "three"

interface QuestionSceneProps {
  isRotating: boolean
  direction: number
  rotation: number
  question: string
}

export default function QuestionScene({ isRotating, direction, rotation, question }: QuestionSceneProps) {
  const groupRef = useRef<THREE.Group>(null)
  const textRef = useRef<THREE.Mesh>(null)

  // Create animated group for the 3D rotation effect
  const { rotationY } = useSpring({
    rotationY: rotation * (Math.PI / 180),
    config: { mass: 1, tension: 180, friction: 30 },
  })

  // Reduce rotation speed by 5x
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.0002 // Reduced from 0.001
    }

    if (textRef.current) {
      textRef.current.lookAt(state.camera.position)
    }
  })

  return (
    <>
      {/* Darker tech-themed background with reduced fog for better visibility */}
      <fog attach="fog" args={["#0b1236", 8, 25]} />
      <color attach="background" args={["#0b1236"]} />

      <animated.group rotation-y={rotationY}>
        <group ref={groupRef}>
          {/* Reduced number of digital particles (binary-like) and moved them further away */}
          {Array.from({ length: 30 }).map(
            (
              _,
              i, // Reduced from 100
            ) => (
              <Float
                key={i}
                speed={0.3} // Reduced from 1
                rotationIntensity={0.2} // Reduced from 1
                floatIntensity={0.5} // Reduced from 2
                position={[
                  (Math.random() - 0.5) * 20, // Spread wider and further away
                  (Math.random() - 0.5) * 20,
                  (Math.random() - 0.5) * 20 - 5, // Push back
                ]}
              >
                <mesh>
                  <boxGeometry args={[0.08, 0.08, 0.08]} /> {/* Smaller size */}
                  <meshStandardMaterial
                    color={Math.random() > 0.5 ? "#38bdf8" : "#0ea5e9"}
                    emissive={Math.random() > 0.5 ? "#38bdf8" : "#0ea5e9"}
                    emissiveIntensity={0.3} // Reduced from 0.5
                    transparent
                    opacity={0.7} // Added transparency
                  />
                </mesh>
              </Float>
            ),
          )}

          {/* Reduced number of circuit board lines and made them more subtle */}
          {Array.from({ length: 8 }).map(
            (
              _,
              i, // Reduced from 20
            ) => (
              <Float
                key={`line-${i}`}
                speed={0.2} // Reduced from 0.5
                rotationIntensity={0.1} // Reduced from 0.2
                floatIntensity={0.1} // Reduced from 0.2
                position={[
                  (Math.random() - 0.5) * 15,
                  (Math.random() - 0.5) * 15,
                  (Math.random() - 0.5) * 10 - 10, // Push further back
                ]}
              >
                <mesh rotation={[Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI]}>
                  <boxGeometry args={[Math.random() * 3 + 1, 0.01, 0.01]} /> {/* Thinner lines */}
                  <meshStandardMaterial
                    color="#0284c7"
                    emissive="#0284c7"
                    emissiveIntensity={0.3} // Reduced from 0.5
                    transparent
                    opacity={0.4} // More transparent
                  />
                </mesh>
              </Float>
            ),
          )}

          {/* CPU/Chip-like structure - moved further back and made more subtle */}
          <Float
            speed={0.2} // Reduced from 0.5
            rotationIntensity={0.1} // Reduced from 0.2
            floatIntensity={0.1} // Reduced from 0.2
            position={[0, 0, -12]} // Moved further back from -5
          >
            <group>
              {/* Main CPU base */}
              <mesh>
                <boxGeometry args={[4, 0.2, 4]} />
                <meshStandardMaterial
                  color="#0b1236"
                  emissive="#0b1236"
                  metalness={0.8}
                  roughness={0.2}
                  transparent
                  opacity={0.7} // Added transparency
                />
              </mesh>

              {/* Reduced CPU grid lines */}
              {Array.from({ length: 3 }).map(
                (
                  _,
                  i, // Reduced from 5
                ) => (
                  <mesh key={`grid-x-${i}`} position={[(i - 1) * 1.2, 0.11, 0]}>
                    <boxGeometry args={[0.03, 0.03, 4]} /> {/* Thinner lines */}
                    <meshStandardMaterial
                      color="#0ea5e9"
                      emissive="#0ea5e9"
                      emissiveIntensity={0.3} // Reduced from 0.5
                      transparent
                      opacity={0.6} // More transparent
                    />
                  </mesh>
                ),
              )}

              {Array.from({ length: 3 }).map(
                (
                  _,
                  i, // Reduced from 5
                ) => (
                  <mesh key={`grid-z-${i}`} position={[0, 0.11, (i - 1) * 1.2]}>
                    <boxGeometry args={[4, 0.03, 0.03]} /> {/* Thinner lines */}
                    <meshStandardMaterial
                      color="#0ea5e9"
                      emissive="#0ea5e9"
                      emissiveIntensity={0.3} // Reduced from 0.5
                      transparent
                      opacity={0.6} // More transparent
                    />
                  </mesh>
                ),
              )}

              {/* CPU center */}
              <mesh position={[0, 0.15, 0]}>
                <boxGeometry args={[1.5, 0.1, 1.5]} />
                <meshStandardMaterial
                  color="#0b1236"
                  emissive="#0b1236"
                  metalness={0.9}
                  roughness={0.1}
                  transparent
                  opacity={0.7} // Added transparency
                />
              </mesh>

              {/* Removed CPU pins to simplify */}
            </group>
          </Float>

          {/* Simplified neural network visualization - fewer nodes, more subtle */}
          <Float
            speed={0.3} // Reduced from 0.8
            rotationIntensity={0.1} // Reduced from 0.3
            floatIntensity={0.1} // Reduced from 0.3
            position={[0, 0, -15]} // Moved further back from -8
          >
            <group>
              {/* Neural network nodes - reduced count */}
              {Array.from({ length: 8 }).map((_, i) => {
                // Reduced from 15
                const x = (Math.random() - 0.5) * 8
                const y = (Math.random() - 0.5) * 8
                const z = (Math.random() - 0.5) * 2
                return (
                  <mesh key={`node-${i}`} position={[x, y, z]}>
                    <sphereGeometry args={[0.12, 16, 16]} /> {/* Slightly smaller */}
                    <meshStandardMaterial
                      color="#22d3ee"
                      emissive="#22d3ee"
                      emissiveIntensity={0.3} // Reduced from 0.5
                      transparent
                      opacity={0.6} // More transparent
                    />
                  </mesh>
                )
              })}

              {/* Neural network connections - reduced count */}
              {Array.from({ length: 10 }).map((_, i) => {
                // Reduced from 20
                const x1 = (Math.random() - 0.5) * 8
                const y1 = (Math.random() - 0.5) * 8
                const z1 = (Math.random() - 0.5) * 2
                const x2 = (Math.random() - 0.5) * 8
                const y2 = (Math.random() - 0.5) * 8
                const z2 = (Math.random() - 0.5) * 2

                // Create a custom geometry for the connection line
                const points = []
                points.push(new THREE.Vector3(x1, y1, z1))
                points.push(new THREE.Vector3(x2, y2, z2))
                const geometry = new THREE.BufferGeometry().setFromPoints(points)

                return (
                  <line key={`connection-${i}`} geometry={geometry}>
                    <lineBasicMaterial
                      color="#0ea5e9"
                      opacity={0.2} // Reduced from 0.3
                      transparent
                      linewidth={1}
                    />
                  </line>
                )
              })}
            </group>
          </Float>
        </group>
      </animated.group>
    </>
  )
}

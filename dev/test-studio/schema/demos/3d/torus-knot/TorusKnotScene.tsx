/* eslint-disable no-multi-assign */
/* eslint-disable react/no-unknown-property */
// Fork of https://codesandbox.io/s/layer-materials-nvup4

import {Environment, OrbitControls} from '@react-three/drei'
import {useFrame, useThree} from '@react-three/fiber'
import {Color, Depth, Fresnel, LayerMaterial} from 'lamina'
import React, {memo, useEffect, useRef} from 'react'
import * as THREE from 'three'

export default function View({element: {base, colorA, colorB, position}, preview = false}: any) {
  return (
    <>
      <Bg base={base} colorA={colorA} colorB={colorB} />
      <Flower base={base} colorA={colorA} colorB={colorB} />
      <mesh>
        <sphereGeometry args={[0.2, 64, 64]} />
        <meshPhysicalMaterial depthWrite={false} transmission={1} thickness={10} roughness={0.65} />
      </mesh>
      <SyncCamera {...position} />
      <OrbitControls enableZoom={!preview} />
      <pointLight position={[10, 10, 5]} />
      <pointLight position={[-10, -10, -5]} color={colorA} />
      <ambientLight intensity={0.4} />
      <Environment preset="warehouse" />
    </>
  )
}

export const SyncCamera = memo(function SyncCamera({x, y, z}: any) {
  const camera = useThree((state) => state.camera)
  useEffect(() => {
    camera.position.set(x, y, z)
  }, [x, y, z, camera.position])

  return null
})

export const Bg = memo(function Bg({base, colorA, colorB}: any) {
  const mesh = useRef<any>()
  useFrame((state, delta) => {
    mesh.current.rotation.x = mesh.current.rotation.y = mesh.current.rotation.z += delta
  })
  return (
    <mesh ref={mesh} scale={100}>
      <sphereGeometry args={[1, 64, 64]} />
      <LayerMaterial attach="material" side={THREE.BackSide}>
        <Color color={base} alpha={1} mode="normal" />
        <Depth
          colorA={colorB}
          colorB={colorA}
          alpha={0.5}
          mode="normal"
          near={0}
          far={300}
          origin={[100, 100, 100]}
        />
      </LayerMaterial>
    </mesh>
  )
})

export const Flower = memo(function Flower({base, colorA, colorB}: any) {
  const mesh = useRef<any>()
  const depth = useRef<any>()
  useFrame((state, delta) => {
    mesh.current.rotation.z += delta / 2
    depth.current.origin.set(-state.mouse.y, state.mouse.x, 0)
  })
  return (
    <mesh rotation-y={Math.PI / 2} scale={[2, 2, 2]} ref={mesh}>
      <torusKnotGeometry args={[0.4, 0.05, 400, 32, 3, 7]} />
      <LayerMaterial>
        <Color color={base} alpha={1} mode="normal" />
        <Depth
          colorA={colorB}
          colorB={colorA}
          alpha={0.5}
          mode="normal"
          near={0}
          far={3}
          origin={[1, 1, 1]}
        />
        <Depth
          ref={depth}
          colorA={colorB}
          colorB="black"
          alpha={1}
          mode="lighten"
          near={0.25}
          far={2}
          origin={[1, 0, 0]}
        />
        <Fresnel mode="softlight" color="white" intensity={0.3} power={2} bias={0} />
      </LayerMaterial>
    </mesh>
  )
})

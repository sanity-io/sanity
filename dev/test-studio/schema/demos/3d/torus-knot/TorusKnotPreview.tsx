import {Canvas, Vector3} from '@react-three/fiber'
import React, {memo, Suspense, useRef} from 'react'
import styled from 'styled-components'
import {Box} from '@sanity/ui'

import View from './TorusKnotScene'
import {useLazyFrameloop} from './useLazyFrameLoop'

const Container = styled(Box)`
  overflow: hidden;
  overflow: clip;
  border-radius: 3px;
  aspect-ratio: 1/1;
  height: 35px;
  width: 35px;
`

export type Props = {
  base: string
  colorA: string
  colorB: string
  position?: {x: number; y: number; z: number}
}
export default memo(function TorusKnotPreview(props: Props) {
  const {base, colorA, colorB, position = {x: 0, y: -0.75, z: 0.75}} = props
  const {x, y, z} = position
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameloop = useLazyFrameloop(canvasRef)
  return (
    <Container>
      <Canvas
        ref={canvasRef}
        linear
        camera={{position: {x, y, z} as Vector3, fov: 80, near: 0.001}}
        frameloop={frameloop}
      >
        <Suspense fallback={null}>
          <View element={{base, colorA, colorB, position: {x, y, z}}} />
        </Suspense>
      </Canvas>
    </Container>
  )
})

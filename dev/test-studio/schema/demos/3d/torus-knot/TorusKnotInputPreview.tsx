import {Box} from '@sanity/ui'
import React, {memo, Suspense, useRef} from 'react'
import styled from 'styled-components'
import {Canvas, Vector3} from '@react-three/fiber'
import View from './TorusKnotScene'
import {useLazyFrameloop} from './useLazyFrameLoop'

const Container = styled(Box)`
  aspect-ratio: 1/1;
`

export type Props = {
  base: string
  colorA: string
  colorB: string
  position?: {x: number; y: number; z: number}
}
export default memo(function TorusKnotInputPreview(props: Props) {
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

import {Canvas, Vector3} from '@react-three/fiber'
import React, {memo, startTransition, Suspense, useEffect, useRef, useState} from 'react'
import styled from 'styled-components'
import {Box} from '@sanity/ui'

import View from './TorusKnotScene'
import {useLazyFrameloop} from './useLazyFrameLoop'

const Container = styled(Box)`
  overflow: hidden;
  overflow: clip;
  border-radius: 1px;
  aspect-ratio: 1/1;
  width: 100%;
`

export type Props = {
  base: string
  colorA: string
  colorB: string
  position?: {x: number; y: number; z: number}
}
export default memo(function TorusKnotPreview(props: Props) {
  const {base, colorA, colorB, position = {x: -1.75, y: 0, z: 0}} = props
  const {x, y, z} = position
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const lazyFrameloop = useLazyFrameloop(canvasRef)
  const [frameloop, setFrameloop] = useState<'always' | 'demand'>('always')

  // eslint-disable-next-line consistent-return
  useEffect(() => {
    if (canvasRef.current) {
      // run animation loop on hover
      const paneItem = canvasRef.current.closest('[data-ui=PaneItem]')
      if (paneItem) {
        const onEnter = () => startTransition(() => setFrameloop('always'))
        const onLeave = () => startTransition(() => setFrameloop('demand'))
        paneItem.addEventListener('pointerenter', onEnter)
        paneItem.addEventListener('pointerleave', onLeave)
        return () => {
          paneItem.removeEventListener('pointerenter', onEnter)
          paneItem.removeEventListener('pointerleave', onLeave)
        }
      }
    }
  }, [])

  return (
    <Container>
      <Canvas
        ref={canvasRef}
        linear
        camera={{position: {x, y, z} as Vector3, fov: 80, near: 0.001}}
        frameloop={
          // eslint-disable-next-line no-nested-ternary
          lazyFrameloop === 'never'
            ? 'never'
            : lazyFrameloop === 'demand' && frameloop === 'always'
              ? 'demand'
              : frameloop
        }
      >
        <Suspense fallback={null}>
          <View element={{base, colorA, colorB, position: {x, y, z}}} preview />
        </Suspense>
      </Canvas>
    </Container>
  )
})

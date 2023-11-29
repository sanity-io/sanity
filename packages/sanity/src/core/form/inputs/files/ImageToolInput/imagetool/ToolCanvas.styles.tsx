import styled from 'styled-components'
import {makeDragAware} from './makeDragAware'

export const DragAwareCanvas = makeDragAware('canvas')

export const RootContainer = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
`

export const CanvasContainer = styled(DragAwareCanvas)`
  display: block;
  position: relative;
  max-width: calc(100% - 0.5em); /* to prevent overlap with change bar */
  max-height: calc(100% + 1em);
  user-select: none;
  // Enable only multi-finger panning and zooming within this element.
  // This prevents single finger panning when manipulating drag handles,
  // which can cause unwanted scrolling in the underlying document body.
  touch-action: pinch-zoom;
`

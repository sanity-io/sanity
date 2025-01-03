import Debug from 'debug'
import {forwardRef, memo, useCallback, useEffect, useRef} from 'react'
import {styled} from 'styled-components'

import {type Coordinate} from './types'

/**
 * Pointer events are used which handles mouse/touch events the same way.
 * - `onDragStart` is called with the \{x, y\} positions relative from the dom node (e.g. where the pointerdown event happened)
 * - `onDrag` and `onDragEnd` are both called with the \{x, y\} difference from the previous position
 * @internal
 */
export interface DragAwareCanvasProps {
  onDragStart: (pos: {x: number; y: number}) => void
  onDrag: (pos: {x: number; y: number}) => void
  onDragEnd: (pos: {x: number; y: number}) => void
  readOnly?: boolean
  onPointerDown?: never
  onPointerMove?: React.PointerEventHandler<HTMLCanvasElement>
  onPointerOut?: React.PointerEventHandler<HTMLCanvasElement>
  height?: string | number | undefined
  width?: string | number | undefined
}

const DragAwareCanvasComponent = forwardRef<HTMLCanvasElement, DragAwareCanvasProps>(
  function DragAwareCanvas(props, ref): React.JSX.Element {
    const {readOnly, onDragStart, onDragEnd, onDrag, ...rest} = props

    const domNode = useRef<HTMLCanvasElement | null>(null)
    const currentPos = useRef<Coordinate | null>(null)
    const isDragging = useRef(false)

    const handleDragStart = useCallback(
      (event: PositionableEvent) => {
        if (readOnly || !domNode.current) {
          return
        }

        if (isDragging.current) {
          debug('Start cancelled, already a drag in progress')
          return
        }

        isDragging.current = true
        const nextPos = getPos(event)
        debug('Drag started %o', nextPos)
        onDragStart(
          getPositionRelativeToRect(nextPos.x, nextPos.y, domNode.current.getBoundingClientRect()),
        )

        currentPos.current = nextPos
      },
      [onDragStart, readOnly],
    )
    const handleDrag = useCallback(
      (event: PositionableEvent) => {
        if (!isDragging.current || readOnly || !currentPos.current) {
          return
        }

        const nextPos = getPos(event)
        const diff = diffPos(nextPos, currentPos.current)
        onDrag(diff)
        debug('moving by %o', diff)
        currentPos.current = nextPos
      },
      [onDrag, readOnly],
    )
    const handleDragCancel = useCallback(() => {
      if (!isDragging.current || readOnly || !currentPos.current || !domNode.current) {
        return
      }

      isDragging.current = false
      onDragEnd(
        getPositionRelativeToRect(
          currentPos.current.x,
          currentPos.current.y,
          domNode.current.getBoundingClientRect(),
        ),
      )

      currentPos.current = null
    }, [onDragEnd, readOnly])
    const handleDragEnd = useCallback(
      (event: PositionableEvent) => {
        if (!isDragging.current || readOnly || !domNode.current) {
          return
        }
        const nextPos = getPos(event)
        onDragEnd(
          getPositionRelativeToRect(nextPos.x, nextPos.y, domNode.current.getBoundingClientRect()),
        )
        isDragging.current = false
        currentPos.current = null
        debug('Done moving %o', nextPos)
      },
      [onDragEnd, readOnly],
    )

    useEffect(() => {
      document.body.addEventListener('pointermove', handleDrag)
      document.body.addEventListener('pointerup', handleDragEnd)
      document.body.addEventListener('pointerleave', handleDragCancel)
      document.body.addEventListener('pointercancel', handleDragCancel)
      return () => {
        document.body.removeEventListener('pointermove', handleDrag)
        document.body.removeEventListener('pointerup', handleDragEnd)
        document.body.removeEventListener('pointerleave', handleDragCancel)
        document.body.removeEventListener('pointercancel', handleDragCancel)
      }
    }, [handleDrag, handleDragCancel, handleDragEnd])

    const setRef = useCallback(
      (node: HTMLCanvasElement | null) => {
        domNode.current = node
        if (typeof ref === 'function') {
          ref(node)
        } else if (ref) {
          ref.current = node
        }
      },
      [ref],
    )

    return (
      <StyledCanvas ref={setRef} onPointerDown={readOnly ? undefined : handleDragStart} {...rest} />
    )
  },
)
export const DragAwareCanvas = memo(
  DragAwareCanvasComponent,
  /*
  function arePropsEqual(oldProps, newProps) {
    const keys = new Set([...Object.keys(oldProps), ...Object.keys(newProps)])
    for (const key of keys) {
      if (!Object.is(oldProps[key], newProps[key])) {
        console.count(`DragAwareCanvas ${key} changed`)
        return false
      }
    }
    return true
  },
  // */
)

type PositionableEvent = globalThis.PointerEvent | React.PointerEvent<HTMLElement>

const debug = Debug('sanity-imagetool')

const StyledCanvas = styled.canvas`
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

function getPositionRelativeToRect(x: number, y: number, rect: {left: number; top: number}) {
  return {
    x: x - rect.left,
    y: y - rect.top,
  }
}

function getPos(event: PositionableEvent): Coordinate {
  return {
    x: event.clientX,
    y: event.clientY,
  }
}

function diffPos(pos: Coordinate, otherPos: Coordinate): Coordinate {
  return {
    x: pos.x - otherPos.x,
    y: pos.y - otherPos.y,
  }
}

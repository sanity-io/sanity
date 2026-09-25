import {type PointerEvent as ReactPointerEvent, type RefObject, useCallback, useState} from 'react'

import {PANEL_HEADER_HEIGHT} from '../CollapsiblePanel'

/** Matches the `min-height` of the query section: the editor keeps at least this much */
const QUERY_MIN_HEIGHT = 120
/** The header plus a few lines of JSON */
const SECTION_MIN_HEIGHT = PANEL_HEADER_HEIGHT + 63

export interface DragResizeOptions {
  /** The column the sections are stacked in */
  containerRef: RefObject<HTMLElement | null>
  /** The section whose top edge is dragged */
  sectionRef: RefObject<HTMLElement | null>
  /** The other collapsible section; its height is reserved when computing the cap */
  siblingRef: RefObject<HTMLElement | null>
}

export interface DragResize {
  /** The dragged height, or `null` while the section sizes itself to its content */
  height: number | null
  dragging: boolean
  onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void
  /** Back to the automatic height */
  reset: () => void
}

/**
 * Drag handling for a section that normally sizes itself to its content: dragging its top edge
 * up makes it taller, bounded so the query editor keeps its minimum height. The handle captures
 * the pointer, so the drag continues while the pointer is outside it.
 */
export function useDragResize({
  containerRef,
  sectionRef,
  siblingRef,
}: DragResizeOptions): DragResize {
  const [height, setHeight] = useState<number | null>(null)
  const [dragging, setDragging] = useState(false)

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const section = sectionRef.current
      const container = containerRef.current
      if (event.button !== 0 || !section || !container) return
      event.preventDefault()

      const handle = event.currentTarget
      const startY = event.clientY
      const startHeight = section.getBoundingClientRect().height
      const siblingHeight = siblingRef.current?.getBoundingClientRect().height ?? 0
      const maxHeight = Math.max(
        SECTION_MIN_HEIGHT,
        container.getBoundingClientRect().height - siblingHeight - QUERY_MIN_HEIGHT,
      )

      const onMove = (move: PointerEvent) => {
        const next = startHeight - (move.clientY - startY)
        setHeight(Math.round(Math.min(Math.max(next, SECTION_MIN_HEIGHT), maxHeight)))
      }
      const onEnd = () => {
        handle.removeEventListener('pointermove', onMove)
        handle.removeEventListener('pointerup', onEnd)
        handle.removeEventListener('pointercancel', onEnd)
        setDragging(false)
      }
      handle.setPointerCapture(event.pointerId)
      handle.addEventListener('pointermove', onMove)
      handle.addEventListener('pointerup', onEnd)
      handle.addEventListener('pointercancel', onEnd)
      setDragging(true)
    },
    [containerRef, sectionRef, siblingRef],
  )

  const reset = useCallback(() => setHeight(null), [])

  return {height, dragging, onPointerDown, reset}
}

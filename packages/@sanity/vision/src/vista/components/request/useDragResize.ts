import {
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
  useCallback,
  useState,
} from 'react'

import {PANEL_HEADER_HEIGHT} from '../CollapsiblePanel'

/** Matches the `min-height` of the query section: the editor keeps at least this much */
const QUERY_MIN_HEIGHT = 120
/** One editor line, the step of a keyboard resize */
const LINE_HEIGHT = 21
/** The header plus a few lines of JSON */
export const SECTION_MIN_HEIGHT = PANEL_HEADER_HEIGHT + LINE_HEIGHT * 3

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
  /** Arrow keys resize by a line (five with Shift), Home and End go to the bounds, Enter resets */
  onKeyDown: (event: ReactKeyboardEvent<HTMLElement>) => void
  /** Back to the automatic height */
  reset: () => void
}

interface Bounds {
  current: number
  min: number
  max: number
}

function clamp(value: number, {min, max}: Bounds): number {
  return Math.round(Math.min(Math.max(value, min), max))
}

/**
 * Resizing for a section that normally sizes itself to its content: dragging its top edge up
 * makes it taller, bounded so the query editor keeps its minimum height and the sibling section
 * keeps its own. The handle captures the pointer, so the drag continues while the pointer is
 * outside it, and the same bounds apply to the keyboard.
 */
export function useDragResize({
  containerRef,
  sectionRef,
  siblingRef,
}: DragResizeOptions): DragResize {
  const [height, setHeight] = useState<number | null>(null)
  const [dragging, setDragging] = useState(false)

  const measure = useCallback((): Bounds | null => {
    const section = sectionRef.current
    const container = containerRef.current
    if (!section || !container) return null
    const siblingHeight = siblingRef.current?.getBoundingClientRect().height ?? 0
    return {
      current: section.getBoundingClientRect().height,
      min: SECTION_MIN_HEIGHT,
      max: Math.max(
        SECTION_MIN_HEIGHT,
        container.getBoundingClientRect().height - siblingHeight - QUERY_MIN_HEIGHT,
      ),
    }
  }, [containerRef, sectionRef, siblingRef])

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const bounds = measure()
      if (event.button !== 0 || !bounds) return
      event.preventDefault()

      const handle = event.currentTarget
      const startY = event.clientY
      const onMove = (move: PointerEvent) => {
        setHeight(clamp(bounds.current - (move.clientY - startY), bounds))
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
    [measure],
  )

  const onKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLElement>) => {
      const step = event.shiftKey ? LINE_HEIGHT * 5 : LINE_HEIGHT
      const next = (bounds: Bounds): number | null => {
        switch (event.key) {
          case 'ArrowUp':
            return bounds.current + step
          case 'ArrowDown':
            return bounds.current - step
          case 'Home':
            return bounds.min
          case 'End':
            return bounds.max
          case 'Enter':
            return null
          default:
            return bounds.current
        }
      }
      const bounds = measure()
      if (!bounds) return
      const target = next(bounds)
      if (target === bounds.current) return
      event.preventDefault()
      setHeight(target === null ? null : clamp(target, bounds))
    },
    [measure],
  )

  const reset = useCallback(() => setHeight(null), [])

  return {height, dragging, onPointerDown, onKeyDown, reset}
}

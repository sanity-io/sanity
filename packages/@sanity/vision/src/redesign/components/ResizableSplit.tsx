import {
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  useCallback,
  useMemo,
  useState,
} from 'react'

import {useContentSize} from '../hooks/useContentSize'
import {cx} from '../util/cx'
import {getSplitSnap, snapDragSize, snapKeyboardStep} from '../util/splitSnap'
import * as styles from './redesign.module.css'

/** The divider's own extent along the axis; the rest of its hit area overlaps the panes */
export const SPLIT_HANDLE_SIZE = 1
/** A keyboard step, five with Shift */
const KEYBOARD_STEP = 16

export interface ResizableSplitProps {
  /** A `vertical` divider puts the panes side by side, a `horizontal` one stacks them */
  split: 'vertical' | 'horizontal'
  /** The pane `size` applies to; the other takes what is left */
  primary?: 'first' | 'second'
  /** The primary pane's size in pixels */
  size: number
  /** The least the primary pane may get */
  minSize: number
  /** The least the other pane keeps */
  minSecondarySize: number
  /** A new size, and whether it holds equal halves (always `false` without `snapToCenter`) */
  onChange: (size: number, snapped: boolean) => void
  /**
   * A drag ended, or a key moved the divider: the size it was left at, and the size before the
   * drag or the key press
   */
  onResizeEnd?: (size: number, startSize: number) => void
  /** Enter on the divider: back to the default size */
  onReset?: () => void
  /**
   * A double-click on the divider. When set, it replaces the snap-to-center double click, which
   * is how Params sizes itself to its content
   */
  onDoubleClick?: () => void
  allowResize?: boolean
  /**
   * Hold the divider at equal halves when a drag or a keyboard step comes close to or past them,
   * and move it there on a double click
   */
  snapToCenter?: boolean
  /**
   * With `snapToCenter`: the divider holds equal halves whatever `size` says, through every
   * container resize, until a drag or a key moves it off them
   */
  snapped?: boolean
  /** Accessible name of the divider */
  label: string
  children: [ReactNode, ReactNode]
  testId?: string
}

interface Bounds {
  min: number
  max: number
}

function clamp(value: number, {min, max}: Bounds): number {
  return Math.round(Math.min(Math.max(value, min), max))
}

/**
 * Two panes with a draggable divider that is also a keyboard-operable `separator`: arrow keys
 * along the axis move it by a step (five with Shift), Home and End go to the bounds, Enter resets,
 * and its ARIA values follow the measured container. Both panes keep their minimum: the divider
 * stops short of either, and a size that no longer fits (a window narrowed after a drag) is
 * clamped for as long as the container is that small, the primary pane winning when it cannot
 * fit both. With `snapToCenter`, a drag within a few pixels of equal halves holds them, and an
 * arrow key step that would pass over them stops there, a double click moves the divider onto
 * them unless `onDoubleClick` handles it; with `snapped` the halves stay equal as the container
 * resizes.
 */
export function ResizableSplit(props: ResizableSplitProps) {
  const {
    split,
    primary = 'first',
    size,
    minSize,
    minSecondarySize,
    onChange,
    onResizeEnd,
    onReset,
    onDoubleClick,
    allowResize = true,
    snapToCenter = false,
    snapped: snappedProp = false,
    label,
    children,
    testId,
  } = props
  const [root, setRoot] = useState<HTMLDivElement | null>(null)
  const contentSize = useContentSize(root)
  const [dragging, setDragging] = useState(false)

  // The bounds follow the observed container size (whole pixels, as the ARIA values are read
  // out). Until it is measured, and while it is not laid out at all (a pane kept mounted under
  // `display: none`, the tool hidden in an `<Activity>`), the size is shown as given and the
  // divider waits: a 0×0 container would otherwise clamp the pane to its minimum and paint that
  // for a frame when the container shows again
  const extent = split === 'vertical' ? contentSize?.width : contentSize?.height
  const bounds = useMemo(
    (): Bounds | null =>
      extent === undefined || extent <= 0
        ? null
        : {
            min: minSize,
            max: Math.max(minSize, Math.floor(extent - minSecondarySize - SPLIT_HANDLE_SIZE)),
          },
    [extent, minSecondarySize, minSize],
  )
  const snap = useMemo(
    () =>
      snapToCenter && bounds && extent !== undefined
        ? getSplitSnap(extent, SPLIT_HANDLE_SIZE, bounds)
        : null,
    [bounds, extent, snapToCenter],
  )
  const shownSize = snap && snappedProp ? snap.center : bounds ? clamp(size, bounds) : size
  const snapped = snap !== null && shownSize === snap.center
  const change = useCallback(
    (next: number) => onChange(next, snap !== null && next === snap.center),
    [onChange, snap],
  )

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!allowResize || event.button !== 0 || !bounds) return
      event.preventDefault()

      const handle = event.currentTarget
      const start = split === 'vertical' ? event.clientX : event.clientY
      let engaged = false
      let dragged: number | undefined
      const onMove = (move: PointerEvent) => {
        const position = split === 'vertical' ? move.clientX : move.clientY
        const delta = position - start
        const drag = snapDragSize(shownSize + (primary === 'first' ? delta : -delta), snap, engaged)
        engaged = drag.engaged
        dragged = clamp(drag.size, bounds)
        change(dragged)
      }
      const onEnd = () => {
        handle.removeEventListener('pointermove', onMove)
        handle.removeEventListener('pointerup', onEnd)
        handle.removeEventListener('pointercancel', onEnd)
        setDragging(false)
        if (dragged !== undefined) onResizeEnd?.(dragged, shownSize)
      }
      handle.setPointerCapture?.(event.pointerId)
      handle.addEventListener('pointermove', onMove)
      handle.addEventListener('pointerup', onEnd)
      handle.addEventListener('pointercancel', onEnd)
      setDragging(true)
    },
    [allowResize, bounds, change, onResizeEnd, primary, shownSize, snap, split],
  )

  const onKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      if (!allowResize || !bounds) return
      const step = event.shiftKey ? KEYBOARD_STEP * 5 : KEYBOARD_STEP
      // The arrows move the divider along the axis; what that does to the size depends on the
      // side the primary pane is on
      const towardsEnd = primary === 'first' ? step : -step
      const [forwardKey, backKey] =
        split === 'vertical' ? ['ArrowRight', 'ArrowLeft'] : ['ArrowDown', 'ArrowUp']
      let target: number
      if (event.key === forwardKey) {
        target = snapKeyboardStep(shownSize, shownSize + towardsEnd, snap)
      } else if (event.key === backKey) {
        target = snapKeyboardStep(shownSize, shownSize - towardsEnd, snap)
      } else if (event.key === 'Home') {
        target = bounds.min
      } else if (event.key === 'End') {
        target = bounds.max
      } else if (event.key === 'Enter') {
        event.preventDefault()
        onReset?.()
        return
      } else {
        return
      }
      event.preventDefault()
      const next = clamp(target, bounds)
      if (next === shownSize) return
      change(next)
      onResizeEnd?.(next, shownSize)
    },
    [allowResize, bounds, change, onResizeEnd, onReset, primary, shownSize, snap, split],
  )

  const handleDoubleClick = useCallback(() => {
    if (!allowResize) return
    if (onDoubleClick) {
      onDoubleClick()
      return
    }
    if (!snap) return
    change(snap.center)
    if (snap.center !== shownSize) onResizeEnd?.(snap.center, shownSize)
  }, [allowResize, change, onDoubleClick, onResizeEnd, shownSize, snap])

  const primaryStyle = {flex: `0 0 ${shownSize}px`}
  return (
    <div
      className={cx(
        styles.splitRoot,
        split === 'vertical' ? styles.splitRootRow : styles.splitRootColumn,
      )}
      data-testid={testId}
      ref={setRoot}
    >
      <div className={styles.splitPane} style={primary === 'first' ? primaryStyle : undefined}>
        {children[0]}
      </div>
      <div
        aria-disabled={allowResize ? undefined : true}
        aria-label={label}
        aria-orientation={split}
        aria-valuemax={bounds?.max}
        aria-valuemin={minSize}
        aria-valuenow={shownSize}
        className={cx(
          styles.splitHandle,
          split === 'vertical' ? styles.splitHandleVertical : styles.splitHandleHorizontal,
          !allowResize && styles.splitHandleDisabled,
        )}
        data-dragging={dragging}
        data-snapped={snapped}
        data-testid={testId && `${testId}-handle`}
        onDoubleClick={handleDoubleClick}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        role="separator"
        tabIndex={allowResize ? 0 : -1}
        title={label}
      />
      <div className={styles.splitPane} style={primary === 'second' ? primaryStyle : undefined}>
        {children[1]}
      </div>
    </div>
  )
}

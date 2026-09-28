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
import {
  splitHandle,
  splitHandleDisabled,
  splitHandleHorizontal,
  splitHandleVertical,
  splitPane,
  splitRoot,
  splitRootColumn,
  splitRootRow,
} from './vista.css'

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
  onChange: (size: number) => void
  /** Enter on the divider: back to the default size */
  onReset?: () => void
  allowResize?: boolean
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
 * fit both.
 */
export function ResizableSplit(props: ResizableSplitProps) {
  const {
    split,
    primary = 'first',
    size,
    minSize,
    minSecondarySize,
    onChange,
    onReset,
    allowResize = true,
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
  const shownSize = bounds ? clamp(size, bounds) : size

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!allowResize || event.button !== 0 || !bounds) return
      event.preventDefault()

      const handle = event.currentTarget
      const start = split === 'vertical' ? event.clientX : event.clientY
      const onMove = (move: PointerEvent) => {
        const position = split === 'vertical' ? move.clientX : move.clientY
        const delta = position - start
        onChange(clamp(shownSize + (primary === 'first' ? delta : -delta), bounds))
      }
      const onEnd = () => {
        handle.removeEventListener('pointermove', onMove)
        handle.removeEventListener('pointerup', onEnd)
        handle.removeEventListener('pointercancel', onEnd)
        setDragging(false)
      }
      handle.setPointerCapture?.(event.pointerId)
      handle.addEventListener('pointermove', onMove)
      handle.addEventListener('pointerup', onEnd)
      handle.addEventListener('pointercancel', onEnd)
      setDragging(true)
    },
    [allowResize, bounds, onChange, primary, shownSize, split],
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
        target = shownSize + towardsEnd
      } else if (event.key === backKey) {
        target = shownSize - towardsEnd
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
      if (next !== shownSize) onChange(next)
    },
    [allowResize, bounds, onChange, onReset, primary, shownSize, split],
  )

  const primaryStyle = {flex: `0 0 ${shownSize}px`}
  return (
    <div
      className={cx(splitRoot, split === 'vertical' ? splitRootRow : splitRootColumn)}
      data-testid={testId}
      ref={setRoot}
    >
      <div className={splitPane} style={primary === 'first' ? primaryStyle : undefined}>
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
          splitHandle,
          split === 'vertical' ? splitHandleVertical : splitHandleHorizontal,
          !allowResize && splitHandleDisabled,
        )}
        data-dragging={dragging}
        data-testid={testId && `${testId}-handle`}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        role="separator"
        tabIndex={allowResize ? 0 : -1}
        title={label}
      />
      <div className={splitPane} style={primary === 'second' ? primaryStyle : undefined}>
        {children[1]}
      </div>
    </div>
  )
}

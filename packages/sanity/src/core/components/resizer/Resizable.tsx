import {clsx} from 'clsx'
import {type ElementType, type HTMLProps, useCallback, useMemo, useRef, useState} from 'react'
import {Box, type BoxProps} from 'ui5'

import {root} from './Resizable.css'
import {Resizer} from './Resizer'

interface ResizableProps {
  minWidth: number
  maxWidth: number
  initialWidth?: number
  resizerPosition?: 'left' | 'right'
}

/**
 * @internal
 * Provides a resizable container with a resizer handle.
 */
export function Resizable(
  props: ResizableProps &
    Omit<BoxProps<ElementType>, 'maxWidth' | 'minWidth'> &
    Omit<HTMLProps<HTMLDivElement>, 'as'>,
) {
  const {
    as: forwardedAs,
    children,
    className,
    minWidth,
    maxWidth,
    initialWidth,
    resizerPosition = 'right',
    ...restProps
  } = props
  const [element, setElement] = useState<HTMLDivElement | null>(null)
  const elementWidthRef = useRef<number>(undefined)
  const [targetWidth, setTargetWidth] = useState<number | undefined>(initialWidth)

  const handleResizeStart = useCallback(() => {
    elementWidthRef.current = element?.offsetWidth
  }, [element])

  const handleResize = useCallback(
    (deltaX: number) => {
      const w = elementWidthRef.current
      if (!w) return
      if (resizerPosition === 'right') {
        setTargetWidth(Math.min(Math.max(w - deltaX, minWidth), maxWidth))
      } else {
        setTargetWidth(Math.min(Math.max(w + deltaX, minWidth), maxWidth))
      }
    },
    [minWidth, maxWidth, resizerPosition],
  )

  const style = useMemo(
    () => (targetWidth ? {flex: 'none', width: targetWidth} : {minWidth, maxWidth}),
    [minWidth, maxWidth, targetWidth],
  )

  // `styled(Box)` rendered whatever `as` named *instead of* the Box (it was `as`, not
  // `forwardedAs`), and its own `style` replaced the caller's. Both are kept as they were.
  const Root: ElementType = forwardedAs ?? Box

  return (
    <Root {...restProps} className={clsx(root, className)} ref={setElement} style={style}>
      {resizerPosition === 'left' && (
        <Resizer onResize={handleResize} onResizeStart={handleResizeStart} position="left" />
      )}
      {children}
      {resizerPosition === 'right' && (
        <Resizer onResize={handleResize} onResizeStart={handleResizeStart} position="right" />
      )}
    </Root>
  )
}

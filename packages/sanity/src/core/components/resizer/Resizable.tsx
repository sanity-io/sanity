import {Box, type BoxProps} from '@sanity/ui'
import {type HTMLProps, useCallback, useMemo, useRef, useState} from 'react'
import {styled} from 'styled-components'

import {Resizer} from './Resizer'

interface ResizableProps {
  minWidth: number
  maxWidth: number
  initialWidth?: number
  resizerPosition?: 'left' | 'right'
}

const Root = styled(Box)`
  position: relative;
  flex: 1;
  padding-left: 1px;
`

/**
 * @internal
 * Provides a resizable container with a resizer handle.
 */
export function Resizable(
  props: ResizableProps & BoxProps & Omit<HTMLProps<HTMLDivElement>, 'as'>,
) {
  const {
    as: forwardedAs,
    children,
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

  return (
    <Root as={forwardedAs} {...restProps} ref={setElement} style={style}>
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

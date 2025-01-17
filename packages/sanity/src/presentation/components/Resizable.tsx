/* eslint-disable no-nested-ternary */
import {Box, type BoxProps} from '@sanity/ui'
import {type HTMLProps, useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {styled} from 'styled-components'

import {useLocalState} from '../useLocalState'
import {Resizer} from './Resizer'

export interface ResizableProps {
  disabled?: boolean
  minWidth: number
  maxWidth?: number
  onResizeStart?: () => void
  onResizeEnd?: () => void
}

const Root = styled(Box)`
  position: relative;
`

export function Resizable(
  props: ResizableProps & BoxProps & Omit<HTMLProps<HTMLDivElement>, 'as'>,
): React.JSX.Element {
  const {
    as: forwardedAs,
    children,
    disabled,
    minWidth,
    maxWidth,
    onResizeStart,
    onResizeEnd,
    style: styleProp,
    ...restProps
  } = props
  const [element, setElement] = useState<HTMLDivElement | null>(null)
  const elementWidthRef = useRef<number>(undefined)
  const [targetWidth, setTargetWidth] = useLocalState<number>('presentation/panel/width', minWidth)

  const handleResizeStart = useCallback(() => {
    onResizeStart?.()
    elementWidthRef.current = element?.offsetWidth
  }, [element, onResizeStart])

  const handleResize = useCallback(
    (deltaX: number) => {
      const width = elementWidthRef.current
      if (!width) return

      setTargetWidth(Math.min(Math.max(width - deltaX, minWidth), maxWidth ?? Infinity))
    },
    [minWidth, maxWidth, setTargetWidth],
  )

  const style = useMemo(
    () =>
      disabled
        ? styleProp
        : targetWidth
          ? {...styleProp, flex: 'none', width: targetWidth}
          : {...styleProp, minWidth, maxWidth},
    [disabled, minWidth, maxWidth, styleProp, targetWidth],
  )

  useEffect(() => {
    setTargetWidth((width) => {
      return maxWidth && width > maxWidth ? maxWidth : width
    })
  }, [maxWidth, setTargetWidth])

  return (
    <Root as={forwardedAs} {...restProps} ref={setElement} style={style}>
      {children}
      <Resizer
        onResize={handleResize}
        onResizeStart={handleResizeStart}
        onResizeEnd={onResizeEnd}
      />
    </Root>
  )
}

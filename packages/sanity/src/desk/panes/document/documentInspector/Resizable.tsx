import React, {HTMLProps, useCallback, useMemo, useRef, useState} from 'react'
import styled from 'styled-components'
import {Box, BoxProps} from '@sanity/ui'
import {Resizer} from './Resizer'

export interface ResizableProps {
  minWidth: number
  maxWidth: number
}

const Root = styled(Box)`
  position: relative;
  flex: 1;
  padding-left: 1px;
`

export function Resizable(
  props: ResizableProps & BoxProps & Omit<HTMLProps<HTMLDivElement>, 'as'>
) {
  const {as: forwardedAs, children, minWidth, maxWidth, ...restProps} = props
  const [element, setElement] = useState<HTMLDivElement | null>(null)
  const elementWidthRef = useRef<number>()
  const [targetWidth, setTargetWidth] = useState<number>()

  const handleResizeStart = useCallback(() => {
    elementWidthRef.current = element?.offsetWidth
  }, [element])

  const handleResize = useCallback(
    (deltaX: number) => {
      const w = elementWidthRef.current

      if (!w) return

      setTargetWidth(Math.min(Math.max(w - deltaX, minWidth), maxWidth))
    },
    [minWidth, maxWidth]
  )

  const style = useMemo(
    () => (targetWidth ? {flex: 'none', width: targetWidth} : {minWidth, maxWidth}),
    [minWidth, maxWidth, targetWidth]
  )

  return (
    <Root as={forwardedAs} {...restProps} ref={setElement} style={style}>
      {children}
      <Resizer onResize={handleResize} onResizeStart={handleResizeStart} />
    </Root>
  )
}

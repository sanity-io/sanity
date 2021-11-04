import React, {useCallback, useMemo, CSSProperties} from 'react'

import styled from 'styled-components'
import {Button, useLayer} from '@sanity/ui'

const StyledButton = styled(Button)`
  position: absolute;
  height: 1px;
  width: 1px;
  overflow: hidden;
  clip: rect(1px, 1px, 1px, 1px);

  &:focus {
    width: auto;
    height: auto;
    clip: auto;
  }
`
type Props = {
  children: React.ReactNode
  onClick: () => void
  style: CSSProperties
}
export function VisibleOnFocusButton({children, onClick, style}: Props) {
  const {zIndex} = useLayer()
  const zIndexStyle = useMemo(() => ({zIndex: zIndex + 3, ...style}), [zIndex, style])
  const handleClick = useCallback(() => {
    onClick()
  }, [onClick])
  return (
    <StyledButton mode="ghost" onClick={handleClick} style={zIndexStyle}>
      {children}
    </StyledButton>
  )
}

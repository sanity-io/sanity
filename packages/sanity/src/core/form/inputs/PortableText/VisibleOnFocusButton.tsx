import {Button, useLayer} from '@sanity/ui'
import React from 'react'
import styled from 'styled-components'

interface VisibleOnFocusButtonProps {
  children: React.ReactNode
  onClick: () => void
}

const Root = styled(Button)<{$zIndex: number}>`
  position: absolute;
  z-index: ${({$zIndex}) => $zIndex};
  margin: 1px;

  &:not(:focus) {
    height: 1px;
    width: 1px;
    overflow: hidden;
    clip: rect(1px, 1px, 1px, 1px);
  }
`

export function VisibleOnFocusButton(props: VisibleOnFocusButtonProps) {
  const {children, onClick} = props
  const {zIndex} = useLayer()
  return (
    <Root mode="ghost" onClick={onClick} $zIndex={zIndex + 1}>
      {children}
    </Root>
  )
}

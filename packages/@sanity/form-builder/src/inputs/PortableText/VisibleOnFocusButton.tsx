import {Button} from '@sanity/ui'
import React from 'react'
import styled from 'styled-components'

interface VisibleOnFocusButtonProps {
  children: React.ReactNode
  onClick: () => void
}

const Root = styled(Button)`
  position: absolute;
  z-index: 3;
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

  return (
    <Root mode="ghost" onClick={onClick}>
      {children}
    </Root>
  )
}

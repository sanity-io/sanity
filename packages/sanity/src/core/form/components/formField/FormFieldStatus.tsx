import React from 'react'
import styled from 'styled-components'

export interface FieldStatusProps {
  children?: React.ReactNode
  maxAvatars?: number
  position?: 'top' | 'bottom'
}

const Root = styled.div`
  display: flex;
  justify-content: flex-end;
  box-sizing: border-box;
  min-height: var(--avatar-height);
  width: 77px;
  margin-left: var(--small-padding);

  &[data-max-avatars='1'] {
    max-width: 23px;
  }

  &[data-position='top'] {
    align-self: flex-start;
  }

  &[data-position='bottom'] {
    align-self: flex-end;
  }
`

export function FormFieldStatus({children, maxAvatars, position = 'bottom'}: FieldStatusProps) {
  return (
    <Root data-max-avatars={maxAvatars} data-position={position}>
      {children}
    </Root>
  )
}

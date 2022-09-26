import React from 'react'
import styled from 'styled-components'

const DividerDiv = styled.div`
  border-right: 1px solid var(--card-border-color);
  height: auto;

  &[data-hidden] {
    opacity: 0;
  }
`

interface CollapseMenuDividerProps {
  hidden?: boolean
}

export function CollapseMenuDivider(props: CollapseMenuDividerProps) {
  const {hidden, ...rest} = props

  return (
    <DividerDiv data-ui="CollapseMenuDivider" data-hidden={hidden ? '' : undefined} {...rest} />
  )
}

import React from 'react'
import styled from 'styled-components'

const DividerDiv = styled.div`
  border-right: 1px solid var(--card-border-color);
  height: auto;
`

export function CollapseMenuDivider({...rest}) {
  return <DividerDiv data-ui="CollapseMenuDivider" {...rest} />
}

import React from 'react'
import styled from 'styled-components'
import {TEXT_DECORATOR_TAGS} from './constants'

interface DecoratorProps {
  mark: string
  children: React.ReactNode
}

const Root = styled.span`
  /* Make sure the annotation styling is visible */
  &[data-mark='code'] {
    mix-blend-mode: multiply;
    color: inherit;
  }
`

export function Decorator(props: DecoratorProps) {
  const {mark, children} = props
  const tag = TEXT_DECORATOR_TAGS[mark]

  return (
    <Root as={tag} data-mark={mark}>
      {children}
    </Root>
  )
}

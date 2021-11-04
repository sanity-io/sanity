import React from 'react'
import styled from 'styled-components'

interface DecoratorProps {
  mark: string
  children: React.ReactNode
}

const Root = styled.span`
  /* Make sure the annotation styling is visible */
  [data-annotation] &[data-decorator='code'] {
    mix-blend-mode: multiply;
    color: inherit;
  }
`

/**
 * @todo: Consider adding `data-mark` to all return paths
 */
export function Decorator(props: DecoratorProps) {
  const {mark, children} = props

  if (mark === 'em') {
    return <Root as="em">{children}</Root>
  }

  if (mark === 'strike-through') {
    return <Root as="s">{children}</Root>
  }

  if (mark === 'underline') {
    return <Root as="u">{children}</Root>
  }

  if (mark === 'strong') {
    return <Root as="strong">{children}</Root>
  }

  if (mark === 'code') {
    return (
      <Root as="code" data-mark={mark}>
        {children}
      </Root>
    )
  }

  return <Root>{children}</Root>
}

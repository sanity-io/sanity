import React, {useMemo} from 'react'
import styled from 'styled-components'

type Props = {
  mark: string
  children: React.ReactNode
}

const Root = styled.span`
  display: inline;
`

export default function Decorator(props: Props) {
  const {mark, children} = props

  const child = useMemo(() => {
    if (mark === 'em') {
      return <em>{children}</em>
    }

    if (mark === 'strike-through') {
      return <s>{children}</s>
    }

    if (mark === 'underline') {
      return <u>{children}</u>
    }

    if (mark === 'strong') {
      return <strong>{children}</strong>
    }

    if (mark === 'code') {
      return <code>{children}</code>
    }

    return children
  }, [children, mark])

  return <Root>{child}</Root>
}

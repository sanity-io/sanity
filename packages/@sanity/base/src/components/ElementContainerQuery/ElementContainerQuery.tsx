import {useElementRect} from '@sanity/ui'
import React, {useState} from 'react'
import styled from 'styled-components'

interface ElementContainerQueryProps extends Omit<React.HTMLProps<HTMLDivElement>, 'as'> {
  children: (rect: DOMRect) => React.ReactElement
  as?: React.ElementType | keyof JSX.IntrinsicElements
}

const Root = styled.div`
  display: block;
`

export function ElementContainerQuery(props: ElementContainerQueryProps) {
  const {children, as, ...rest} = props
  const [el, setRootEl] = useState<HTMLDivElement | null>(null)
  const rect = useElementRect(el)

  if (typeof children !== 'function') {
    return children
  }

  return (
    <Root {...rest} as={as} ref={setRootEl}>
      {rect ? children(rect) : null}
    </Root>
  )
}

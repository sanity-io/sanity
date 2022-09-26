import React from 'react'
import styled from 'styled-components'

const Quote = styled.blockquote`
  margin: 0;
`

export default function Blockquote({children}: {children: React.ReactNode}): JSX.Element {
  return (
    <div>
      <Quote>{children}</Quote>
    </div>
  )
}

import {Heading} from '@sanity/ui'
import React from 'react'
import styled from 'styled-components'

const headingSizes = {
  h1: 2,
  h2: 1,
  h3: 0,
  h4: 0,
  h5: 0,
  h6: 0,
}

const StyledHeading = styled(Heading)`
  &:not([hidden]) {
    display: inline;
    text-transform: none;
    margin: 0;

    &::before,
    &::after {
      content: unset;
    }
  }
`

export default function Header({
  style,
  children,
}: {
  style: string
  children: React.ReactNode
}): JSX.Element {
  return <StyledHeading size={headingSizes[style]}>{children}</StyledHeading>
}

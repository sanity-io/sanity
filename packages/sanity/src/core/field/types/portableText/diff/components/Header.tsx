import {Heading} from '@sanity/ui'
import {type ReactNode} from 'react'
import {styled} from 'styled-components'

const headingSizes: Record<string, number | undefined> = {
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

export function Header({style, children}: {style: string; children: ReactNode}): React.JSX.Element {
  return <StyledHeading size={headingSizes[style]}>{children}</StyledHeading>
}

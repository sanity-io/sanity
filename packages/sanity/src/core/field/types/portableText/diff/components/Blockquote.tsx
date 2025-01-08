import {type ReactNode} from 'react'
import {styled} from 'styled-components'

const Quote = styled.blockquote`
  margin: 0;
`

export function Blockquote({children}: {children: ReactNode}): React.JSX.Element {
  return (
    <div>
      <Quote>{children}</Quote>
    </div>
  )
}

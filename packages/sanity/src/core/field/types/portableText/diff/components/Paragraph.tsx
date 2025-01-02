import {type ReactNode} from 'react'
import {styled} from 'styled-components'

// This can contain nested <div> elements, so it's not rendered as a <p> element
const StyledParagraph = styled.div`
  text-transform: none;
  white-space: wrap;
  overflow-wrap: break-word;
  margin: 0;
`

export function Paragraph({children}: {children: ReactNode}): React.JSX.Element {
  return <StyledParagraph>{children}</StyledParagraph>
}

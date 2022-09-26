import React from 'react'
import styled from 'styled-components'

const StyledParagraph = styled.p`
  text-transform: none;
  white-space: wrap;
  overflow-wrap: break-word;
  margin: 0;
`

export default function Paragraph({children}: {children: React.ReactNode}): JSX.Element {
  return <StyledParagraph>{children}</StyledParagraph>
}

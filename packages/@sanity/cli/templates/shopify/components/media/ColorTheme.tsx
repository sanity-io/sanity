import React from 'react'
import { css, styled } from 'styled-components'

interface Props {
  background?: string
  text?: string
}

interface StyledSpanProps {
  background?: string
}

const StyledSpan = styled.span<StyledSpanProps>(({background}) => {
  const bg = background || 'white'

  return css`
    align-items: center;
    background-color: ${bg};
    border-radius: inherit;
    display: flex;
    height: 100%;
    justify-content: center;
    overflow: hidden;
    width: 100%;
  `
})

const ColorThemePreview = (props: Props) => {
  const {background, text} = props

  return (
    <StyledSpan background={background}>
      {text && <span style={{color: text, fontSize: '1.5em', fontWeight: 600}}>T</span>}
    </StyledSpan>
  )
}

export default ColorThemePreview

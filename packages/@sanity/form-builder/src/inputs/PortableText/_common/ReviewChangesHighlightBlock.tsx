import {rgba} from '@sanity/ui'
import styled, {css} from 'styled-components'

export const ReviewChangesHighlightBlock = styled.div(({theme}) => {
  const {radius, space, color} = theme.sanity
  const bg = rgba(color.spot.yellow, 0.2)

  return css`
    position: absolute;
    border-radius: ${radius[3]}px;
    top: -${space[2]}px;
    bottom: -${space[1] + space[1]}px;
    left: ${space[4] + space[1]}px;
    right: 0;
    background-color: ${bg};
  `
})

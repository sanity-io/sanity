import {rgba} from '@sanity/ui'
import {css, styled} from 'styled-components'

export const ReviewChangesHighlightBlock = styled.div<{
  $fullScreen: boolean
}>(({theme, $fullScreen}) => {
  const {radius, space, color} = theme.sanity
  const bg = rgba(color.spot.yellow, 0.2)

  return css`
    position: absolute;
    border-radius: ${radius[3]}px;
    top: -${space[2]}px;
    bottom: -${space[1] + space[1]}px;
    left: ${$fullScreen ? space[4] + space[1] : space[1]}px;
    right: ${space[1]}px;
    background-color: ${bg};
    pointer-events: none;
  `
})

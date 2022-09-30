import {Theme} from '@sanity/ui'
import styled, {css} from 'styled-components'
import {ClampedRect} from './ClampedRect'

interface PathProps {
  theme: Theme
}

export const DebugRect = styled.rect`
  stroke: #ccc;
  fill: none;
  pointer-events: none;
  stroke-linecap: round;
`

export const ConnectorPath = styled.path(({theme}: PathProps) => {
  /* these colours aren't freely available on the current theme */
  const strokeColor = theme.sanity.color.spot.yellow

  return css`
    fill: none;
    pointer-events: none;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke: ${strokeColor};
  `
})

export const InteractivePath = styled.path(({theme}: PathProps) => {
  /* these colours aren't freely available on the current theme */
  const strokeColor = theme.sanity.color.spot.yellow

  return css`
    fill: none;
    pointer-events: stroke;
    stroke: ${strokeColor};
    cursor: pointer;
    stroke-linecap: round;
    stroke-linejoin: round;
    opacity: 0;

    &:hover {
      opacity: 0.2;
    }
  `
})

export const RightBarWrapper = styled(ClampedRect)(({theme}: PathProps) => {
  /* these colours aren't freely available on the current theme */
  const strokeColor = theme.sanity.color.spot.yellow

  return css`
    stroke: none;
    pointer-events: none;
    fill: ${strokeColor};
  `
})

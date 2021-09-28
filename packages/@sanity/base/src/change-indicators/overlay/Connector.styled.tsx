import {Theme} from '@sanity/ui'
import styled, {css} from 'styled-components'

interface PathInterface {
  focused: boolean
  revertedHovered: boolean
  hovered: boolean
  theme: Theme
}

export const DebugRectWrapper = styled.rect`
  stroke: #ccc;
  fill: none;
  pointer-events: none;
  stroke-linecap: round;
`

export const PathWrapper = styled.path(
  ({focused, revertedHovered, hovered, theme}: PathInterface) => {
    /* these colours aren't freeøy available on the current theme */
    const focusColor = theme.sanity.color.spot.blue
    const hoveredColor = theme.sanity.color.spot.yellow

    return css`
      fill: none;
      pointer-events: none;
      stroke-linecap: round;
      stroke-linejoin: round;

      ${focused &&
      css`
        stroke: ${focusColor};
      `}

      ${revertedHovered &&
      css`
        stroke: var(--card-accent-fg-color);
      `}

    ${hovered &&
      css`
        stroke: ${hoveredColor};
      `}
    `
  }
)

export const InteractivePathWrapper = styled.path`
  fill: none;
  pointer-events: stroke;
  stroke: var(--card-focus-ring-color);
  cursor: pointer;
  stroke-linecap: round;
  stroke-linejoin: round;
  opacity: 0;

  &:hover {
    opacity: 0.1;
  }
`

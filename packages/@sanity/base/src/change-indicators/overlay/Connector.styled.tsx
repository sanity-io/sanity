import {Theme} from '@sanity/ui'
import styled, {css} from 'styled-components'
import {ClampedRect} from './ClampedRect'

interface PathProps {
  focused: boolean
  revertedHovered: boolean
  hovered: boolean
  theme: Theme
}

export const DebugRect = styled.rect`
  stroke: #ccc;
  fill: none;
  pointer-events: none;
  stroke-linecap: round;
`

export const ConnectorPath = styled.path(
  ({focused, revertedHovered, hovered, theme}: PathProps) => {
    /* these colours aren't freely available on the current theme */
    const hoveredColor = theme.sanity.color.spot.yellow

    return css`
      fill: none;
      pointer-events: none;
      stroke-linecap: round;
      stroke-linejoin: round;

      ${focused &&
      css`
        stroke: var(--card-focus-ring-color);
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

export const InteractivePath = styled.path`
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

export const RightBarWrapper = styled(ClampedRect)(
  ({focused, revertedHovered, hovered, theme}: PathProps) => {
    /* these colours aren't freely available on the current theme */
    const hoveredColor = theme.sanity.color.spot.yellow

    return css`
      stroke: none;
      pointer-events: none;

      ${focused &&
      css`
        fill: var(--card-focus-ring-color);
      `}

      ${revertedHovered &&
      css`
        fill: var(--card-accent-fg-color);
      `}

    ${hovered &&
      css`
        fill: ${hoveredColor};
      `}
    `
  }
)

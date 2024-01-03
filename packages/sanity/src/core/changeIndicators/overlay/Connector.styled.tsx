/* eslint-disable camelcase */

import styled from 'styled-components'
import {ClampedRect} from './ClampedRect'

export const DebugRect = styled.rect`
  stroke: #ccc;
  fill: none;
  pointer-events: none;
  stroke-linecap: round;
`

export const ConnectorPath = styled.path`
  fill: none;
  pointer-events: none;
  stroke-linejoin: round;
  stroke: var(--card-badge-caution-dot-color);
`

export const InteractivePath = styled.path`
  fill: none;
  pointer-events: stroke;
  stroke: transparent;
  cursor: pointer;
  stroke-linecap: round;
  stroke-linejoin: round;
  opacity: 0;

  &:hover {
    opacity: 0.2;
  }
`

export const RightBarWrapper = styled(ClampedRect)`
  stroke: none;
  pointer-events: none;
  fill: var(--card-badge-caution-dot-color);
`

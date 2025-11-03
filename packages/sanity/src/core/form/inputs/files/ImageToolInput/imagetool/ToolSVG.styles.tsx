import {vars} from '@sanity/ui/css'
import {css, styled} from 'styled-components'

export const SVGContainer = styled.div`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  overflow: visible;
  touch-action: none;
  -webkit-touch-callout: none;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
  -webkit-user-select: none;
`

export const StyledSVG = styled.svg`
  display: block;
  overflow: visible;
  shape-rendering: crispEdges;
`

export const DarkenedOverlay = styled.rect`
  fill: rgba(0, 0, 0, 0.5);
  pointer-events: none;
`

export interface StyledElementProps {
  $focused?: boolean
  $hovered?: boolean
}

export const getCropStrokeColor = (props: StyledElementProps): string => {
  if (props.$focused) return vars.color.focusRing
  if (props.$hovered) return 'rgba(255, 255, 255, 1)'
  return 'rgba(255, 255, 255, .5)'
}

export const getHotspotStrokeColor = (props: StyledElementProps): string => {
  if (props.$focused) return vars.color.focusRing
  if (props.$hovered) return 'rgba(255, 255, 255, 1)'
  return 'rgba(255, 255, 255, .5)'
}

export const getHandleStrokeColor = (props: StyledElementProps): string => {
  if (props.$focused) return vars.color.focusRing
  return '#000'
}

export const CropRect = styled.rect<StyledElementProps>`
  fill: none;
  stroke: ${getCropStrokeColor};
  stroke-opacity: 1;
  stroke-width: 1px;
  outline: none;
  ${(props) =>
    props.$focused &&
    css`
      stroke-width: 2px;
      filter: drop-shadow(0px 0px 2px rgba(0, 0, 0, 0.3));
    `}
`

export const CropCornerHandle = styled.path<StyledElementProps>`
  fill: #fff;
  stroke: ${getHandleStrokeColor};
  stroke-width: 1;
  outline: none;
`

export const CropEdgeHandle = styled.rect<StyledElementProps>`
  fill: #fff;
  stroke: ${getHandleStrokeColor};
  stroke-width: 1;
  outline: none;
`

export const HotspotEllipse = styled.ellipse<StyledElementProps>`
  fill: transparent;
  stroke: ${getHotspotStrokeColor};
  stroke-opacity: 1;
  stroke-width: 1px;
  outline: none;
  ${(props) =>
    props.$focused &&
    css`
      stroke-width: 2px;
    `}
`

export const HotspotHandle = styled.circle<StyledElementProps>`
  fill: #fff;
  stroke: ${getHandleStrokeColor};
  stroke-width: 1;
  outline: none;
`

export const CropHandleInteractionArea = styled.rect<StyledElementProps>`
  fill: transparent;
  stroke: transparent;
  pointer-events: all;
`

export const HotspotHandleInteractionArea = styled.circle`
  fill: transparent;
  stroke: transparent;
  pointer-events: all;
`

export const Guidelines = styled.g`
  ${() => {
    return css`
      stroke: ${vars.color.fg};
      stroke-opacity: 0.2;
      stroke-width: 1px;
      stroke-dasharray: 3, 3;
      pointer-events: none;
    `
  }}
`

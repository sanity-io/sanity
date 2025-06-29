import {vars} from '@sanity/ui/css'
import {type Radius} from '@sanity/ui/theme'
import {css, styled} from 'styled-components'

import {PREVIEW_SIZES} from '../constants'
import {type PreviewLayoutKey, type PreviewMediaDimensions} from '../types'

const rem = (value: number) => `${value / 16}rem`

export const MediaWrapper = styled.span<{
  $dimensions: PreviewMediaDimensions
  $layout: PreviewLayoutKey
  $radius: Radius
  $responsive: boolean
}>((props) => {
  const {$dimensions, $layout, $radius, $responsive} = props
  const width = $dimensions.width || 0
  const height = $dimensions.width || 0
  const iconSize = PREVIEW_SIZES[$layout].icon

  return css`
    position: relative;
    width: ${$responsive ? '100%' : rem(width)};
    height: ${$responsive ? '100%' : rem(height)};
    min-width: ${$responsive ? undefined : rem(width)};
    border-radius: ${vars.radius[$radius]};
    display: flex;
    overflow: hidden;
    overflow: clip;
    align-items: center;
    justify-content: center;

    & img {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      object-fit: contain;
      border-radius: inherit;
    }

    & svg {
      // Shared styles for SVG icons
      color: ${vars.color.muted.fg};
      display: block;
      flex: 1;

      // Specific styles for non Sanity icons
      &:not([data-sanity-icon]) {
        height: 1em;
        width: 1em;
        max-width: 1em;
        max-height: 1em;
      }

      // Specific styles for Sanity icons
      &[data-sanity-icon] {
        display: block;
        font-size: calc(${iconSize} / 16 * 1em);
      }
    }

    & > span[data-border] {
      display: block;
      position: absolute;
      left: 0;
      top: 0;
      right: 0;
      bottom: 0;
      box-shadow: inset 0 0 0 1px ${vars.color.fg};
      opacity: 0.1;
      border-radius: inherit;
      pointer-events: none;
    }
  `
})

MediaWrapper.displayName = 'Styled(MediaWrapper)'

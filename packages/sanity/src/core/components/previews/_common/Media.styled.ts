import {rem} from '@sanity/ui'
import styled, {css} from 'styled-components'
import {PREVIEW_ICON_SIZE} from '../constants'
import {PreviewLayoutKey, PreviewMediaDimensions} from '../types'

export const MediaWrapper = styled.span<{
  $dimensions: PreviewMediaDimensions
  $layout: PreviewLayoutKey
  $radius: number
  $responsive: boolean
}>((props) => {
  const {$dimensions, $layout, $radius, $responsive} = props
  const width = $dimensions.width || 0
  const height = $dimensions.width || 0
  const iconSize = PREVIEW_ICON_SIZE[$layout]

  return css`
    width: ${$responsive ? '100%' : rem(width)};
    height: ${$responsive ? '100%' : rem(height)};
    min-width: ${$responsive ? undefined : rem(width)};
    border-radius: ${({theme}) => rem(theme.sanity.radius[$radius])};
    display: flex;
    overflow: hidden;
    overflow: clip;
    align-items: center;
    justify-content: center;

    & img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      border-radius: inherit;
    }

    & svg {
      flex: 1;
      font-size: calc(21 / 16 * 1em);
    }

    & [data-sanity-icon] {
      display: block;
      font-size: calc(${iconSize} / 16 * 1em);
    }

    /*
      NOTE on why we can’t use the ":after" pseudo-element:
      The thing is we only want the shadow when then <MediaWrapper> contains
      something else than <svg> – icons should not have the shadow.
      This is why we use the "*:not(svg) + span" selector to target only that
      situation to render the shadow.
    */
    & *:not(svg) + span {
      display: block;
      position: absolute;
      left: 0;
      top: 0;
      right: 0;
      bottom: 0;
      box-shadow: inset 0 0 0 1px var(--card-fg-color);
      opacity: 0.2;
      border-radius: inherit;
    }
  `
})

MediaWrapper.displayName = 'MediaWrapper'

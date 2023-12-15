import {rem} from '@sanity/ui'
import styled, {css} from 'styled-components'
import {PREVIEW_SIZES} from '../constants'
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
  const iconSize = PREVIEW_SIZES[$layout].icon

  return css`
    position: relative;
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
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      object-fit: contain;
      border-radius: inherit;
    }

    & svg {
      color: var(--card-icon-color);
      display: block;
      flex: 1;
      font-size: calc(21 / 16 * 1em);
    }

    & [data-sanity-icon] {
      display: block;
      font-size: calc(${iconSize} / 16 * 1em);
    }

    & > span[data-border] {
      display: block;
      position: absolute;
      left: 0;
      top: 0;
      right: 0;
      bottom: 0;
      box-shadow: inset 0 0 0 1px var(--card-fg-color);
      opacity: 0.1;
      border-radius: inherit;
      pointer-events: none;
    }
  `
})

MediaWrapper.displayName = 'MediaWrapper'

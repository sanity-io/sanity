import {Box, Flex, Layer, rgba, TextSkeleton, Text, Theme, Card} from '@sanity/ui'
import styled, {css} from 'styled-components'

/**
 * Left/right border offsets for header components (in px).
 */
const BORDER_OFFSET_X = 12

interface RootProps {
  $borderBottom?: boolean
  'data-collapsed'?: string
  'data-testid'?: string
  $isContentScrollable?: boolean
  $hasScrolledFromTop?: boolean
}

export const Root = styled(Layer)<RootProps>(({
  $borderBottom = true,
  $isContentScrollable,
  $hasScrolledFromTop,
}) => {
  return css`
    line-height: 0;
    position: sticky;
    top: 0;

    &:not([data-collapsed]):after {
      content: '';
      display: block;
      position: absolute;
      left: ${BORDER_OFFSET_X}px;
      right: ${BORDER_OFFSET_X}px;
      bottom: -1px;
      border-bottom: ${$borderBottom ? '1px solid var(--card-shadow-outline-color)' : 'none'};
      opacity: ${() => ($isContentScrollable && $hasScrolledFromTop ? 1 : 0)};
      transition: opacity 200ms ease-in;
    }
  `
})

export const Layout = styled(Flex)`
  transform-origin: calc(51px / 2);

  [data-collapsed] > div > & {
    transform: rotate(90deg);
  }
`

export const TitleCard = styled(Card)(({theme}: {theme: Theme}) => {
  const {fg, bg} = theme.sanity.color.card.enabled

  // Disable color updates on hover
  return css`
    background-color: ${bg};

    [data-ui='Text'] {
      color: ${fg};
    }
  `
})

export const TitleTextSkeleton = styled(TextSkeleton)`
  width: 66%;
  max-width: 175px;
`

export const TitleText = styled(Text)`
  cursor: default;
  outline: none;
`

export const TabsBox = styled(Box)(({theme}: {theme: Theme}) => {
  const {color, space} = theme.sanity

  return css`
    overflow: hidden;
    overflow: clip;
    position: relative;

    & > div {
      white-space: nowrap;
      overflow: auto;
      /* Hide scrollbars */
      scrollbar-width: none;
      &::-webkit-scrollbar {
        width: 0;
        height: 0;
      }
    }

    /* right padding */
    & > div:after {
      content: '';
      display: inline-block;
      top: 0;
      right: 0;
      bottom: 0;
      width: ${space[3]}px;
      height: 1px;
    }

    /* Gradient that makes it look like tabs disappear into nothing (looks nicer) */
    &:after {
      content: '';
      display: block;
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(to right, ${rgba(color.base.bg, 0)}, var(--card-bg-color));
      width: ${space[3]}px;
      pointer-events: none;
    }
  `
})

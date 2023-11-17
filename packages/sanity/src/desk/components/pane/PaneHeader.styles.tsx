import {Box, Flex, Layer, rgba, TextSkeleton, Text, Theme, Card} from '@sanity/ui'
import styled, {css} from 'styled-components'

interface RootProps {
  $borderBottom?: boolean
  $shadowBottom?: boolean
}

export const Root = styled(Layer)<RootProps>(({$borderBottom = false, $shadowBottom = false}) => {
  return css`
    line-height: 0;
    position: sticky;
    top: 0;
    box-shadow: ${$shadowBottom ? '0 0 10px var(--card-shadow-outline-color)' : 'none'};
    transition: box-shadow 200ms ease-in;
    opacity: 1;

    &:not([data-collapsed]):after {
      content: '';
      display: block;
      position: absolute;
      left: 0px;
      right: 0px;
      bottom: -1px;
      border-bottom: 1px solid ${$borderBottom ? 'var(--card-shadow-outline-color)' : 'transparent'};
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

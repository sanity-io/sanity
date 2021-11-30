import {Box, Flex, Layer, rgba, TextSkeleton, Text, Theme} from '@sanity/ui'
import styled, {css} from 'styled-components'

export const Root = styled(Layer)`
  line-height: 0;
  position: sticky;
  top: 0;

  &:not([data-collapsed]):after {
    content: '';
    display: block;
    position: absolute;
    left: 0;
    right: 0;
    bottom: -1px;
    border-bottom: 1px solid var(--card-shadow-outline-color);
  }
`

export const Layout = styled(Flex)`
  transform-origin: calc(51px / 2);

  [data-collapsed] > div > & {
    transform: rotate(90deg);
  }
`

export const TitleBox = styled(Box)``

export const TitleTextSkeleton = styled(TextSkeleton)`
  width: 66%;
  max-width: 175px;
`

export const TitleText = styled(Text)`
  cursor: default;
  outline: none;
`

const TABS_SCROLL_PADDING = 100

export const TabsBox = styled(Box)(({theme}: {theme: Theme}) => {
  const {color, space} = theme.sanity

  return css`
    margin: -${space[2]}px 0 -${space[2]}px -${space[3]}px;
    overflow: hidden;
    position: relative;

    & > div {
      white-space: nowrap;
      padding: ${space[2]}px 0 calc(${TABS_SCROLL_PADDING}px + ${space[2]}px) ${space[3]}px;
      margin-bottom: ${0 - TABS_SCROLL_PADDING}px;
      overflow: auto;

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

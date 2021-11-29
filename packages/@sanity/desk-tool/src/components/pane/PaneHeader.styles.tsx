import type {Theme} from '@sanity/ui'
import {Box, Flex, Layer, rgba, TextSkeleton, Text} from '@sanity/ui'
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

export const TabsBox = styled(Box)(({theme}: {theme: Theme}) => {
  const {color} = theme.sanity

  return css`
    margin: -3px 0 -3px -12px;
    overflow: hidden;
    position: relative;

    & > div {
      white-space: nowrap;
      padding: 3px 0 103px 12px;
      margin-bottom: -100px;
      overflow: auto;

      /* right padding */
      & > div:after {
        content: '';
        display: inline-block;
        top: 0;
        right: 0;
        bottom: 0;
        width: 12px;
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
      width: 12px;
      pointer-events: none;
    }
  `
})

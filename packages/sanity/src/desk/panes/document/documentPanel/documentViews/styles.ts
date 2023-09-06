import {Box, Theme} from '@sanity/ui'
import styled, {css} from 'styled-components'

export const Root = styled(Box)`
  position: relative;
`

export const Title = styled.h6(
  ({theme, $titleHeight, $muted}: {theme: Theme; $titleHeight?: number; $muted?: boolean}) => {
    const {fontSize, lineHeight} = theme.sanity.fonts.heading.sizes[5]

    return css`
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: ${$titleHeight ? Math.ceil($titleHeight / lineHeight) : 'auto'};
      overflow: hidden;
      font-size: ${fontSize}px;
      margin: 0;
      line-height: ${lineHeight}px;
      height: ${$titleHeight ? `${$titleHeight}px` : 'auto'};
      ${$muted ? `color: ${theme.sanity.color.card.disabled.fg};` : ''}
    `
  },
)

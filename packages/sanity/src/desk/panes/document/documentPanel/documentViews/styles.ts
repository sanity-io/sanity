import {Box, Theme} from '@sanity/ui'
import styled, {css} from 'styled-components'

export const Root = styled(Box)`
  position: relative;
`
interface TitleProps {
  $titleHeight?: number
  $muted?: boolean
  theme: Theme
}
export const Title = styled.h6<TitleProps>`
  ${({$titleHeight, $muted, theme}) => {
    const {lineHeight} = theme.sanity.fonts.heading.sizes[5]

    const fontSizeSmall = theme.sanity.fonts.heading.sizes[3].fontSize
    const fontSizeMedium = theme.sanity.fonts.heading.sizes[4].fontSize
    const fontSizeLarge = theme.sanity.fonts.heading.sizes[5].fontSize

    return css`
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: ${$titleHeight ? Math.ceil($titleHeight / lineHeight) : 'auto'};
      overflow: hidden;
      font-size: ${fontSizeSmall}px;
      [data-eq-min~='0'] > & {
        font-size: ${fontSizeMedium}px;
      }
      [data-eq-min~='1'] > & {
        font-size: ${fontSizeLarge}px;
      }
      margin: 0;
      line-height: ${lineHeight}px;
      height: ${$titleHeight ? `${$titleHeight}px` : 'auto'};
      ${$muted ? `color: ${theme.sanity.color.card.disabled.fg};` : ''}
    `
  }}
`

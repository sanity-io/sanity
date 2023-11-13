import {Box, Heading} from '@sanity/ui'
import styled, {css} from 'styled-components'

export const Root = styled(Box)`
  position: relative;
`

export const Title = styled(Heading)`
  ${({theme}) => {
    const fontSizeSmall = theme.sanity.fonts.heading.sizes[3].fontSize
    const fontSizeLarge = theme.sanity.fonts.heading.sizes[4].fontSize

    return css`
      overflow-wrap: break-word;
      font-size: ${fontSizeSmall}px;
      [data-eq-min~='1'] > & {
        font-size: ${fontSizeLarge}px;
      }
    `
  }}
`

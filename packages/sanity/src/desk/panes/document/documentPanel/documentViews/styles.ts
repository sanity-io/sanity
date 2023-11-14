import {Box} from '@sanity/ui'
import styled, {css} from 'styled-components'

export const Root = styled(Box)`
  position: relative;
`

// Use CSS container queries to conditionally render headings at different sizes.
// Hide if container queries are not supported.
export const TitleContainer = styled(Box)`
  ${({theme}) => {
    return css`
      @supports not (container-type: inline-size) {
        display: none !important;
      }

      container-type: inline-size;

      [data-heading] {
        font-size: ${theme.sanity.fonts.heading.sizes[3].fontSize}px;
        overflow-wrap: break-word;
      }

      @container (min-width: 550px) {
        [data-heading] {
          font-size: ${theme.sanity.fonts.heading.sizes[4].fontSize}px;
        }
      }
    `
  }}
`

import {Box, Text} from '@sanity/ui'
import styled from 'styled-components'

export const InlineBox = styled(Box)`
  &:not([hidden]) {
    display: inline;
    align-items: center;

    &[data-changed] {
      cursor: pointer;
    }
  }
`

export const InlineText = styled(Text)`
  &:not([hidden]) {
    display: inline;
    color: inherit;
  }
`

export const PreviewContainer = styled(Box)`
  &:not([hidden]) {
    display: inline-flex;
    align-items: center;

    ${InlineBox} [data-ui="Text"] {
      opacity: 0.5;
    }
  }
`

export const PopoverContainer = styled(Box)`
  min-width: 160px;
  max-height: 40vh;
  overflow-y: auto;
`

import {styled} from 'styled-components'
import {Box} from 'ui5'

export const InlineBox = styled(Box)`
  &:not([hidden]) {
    display: inline;
    align-items: center;

    &[data-changed] {
      cursor: pointer;
    }
  }
`

export const PreviewContainer = styled(Box)`
  &:not([hidden]) {
    display: inline-flex;
    align-items: center;

    ${InlineBox} [data-ui='Text'],
    ${InlineBox} [data-ui="Icon"] {
      opacity: 0.5;
    }
  }
`

export const PopoverContainer = styled(Box)`
  min-width: 160px;
  max-height: 40vh;
  overflow-y: auto;
`

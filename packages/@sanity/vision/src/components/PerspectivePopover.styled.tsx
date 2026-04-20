import {Box} from '@sanity/ui'
import {styled} from 'styled-components'

export const PerspectivePopoverContent = styled(Box)`
  /* This limits the width of the popover content */
  max-width: 240px;
`

export const PerspectivePopoverLink = styled.a`
  cursor: pointer;
  margin-right: auto;
`

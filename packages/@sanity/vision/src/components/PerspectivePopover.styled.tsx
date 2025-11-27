import {Box} from '@sanity/ui'
import {styled, type StyledComponent} from 'styled-components'

export const PerspectivePopoverContent: StyledComponent<typeof Box, any> = styled(Box)`
  /* This limits the width of the popover content */
  max-width: 240px;
`

export const PerspectivePopoverLink: StyledComponent<'a', any> = styled.a`
  cursor: pointer;
  margin-right: auto;
`

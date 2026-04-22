import {Box, Stack} from '@sanity/ui'
import {styled} from 'styled-components'

export const FixedHeader = styled(Stack)`
  position: sticky;
  top: 0;
  background: ${({theme}) => theme.sanity.color.base.bg};
  z-index: 1;
`

export const ScrollContainer = styled(Box)`
  height: auto;
  width: 100%;
  min-width: 0;
  overflow: visible;
`

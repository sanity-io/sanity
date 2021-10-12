import {Box, Flex, Stack} from '@sanity/ui'
import styled from 'styled-components'

export const RootStack = styled(Stack)`
  user-select: none;
`

export const MediaWrapper = styled(Box)`
  position: relative;
  flex: 1;

  img {
    display: block;
    width: 100%;
    height: auto;
    pointer-events: none;
  }

  svg {
    display: block;
    width: calc(2.5rem + 1px) !important;
    height: calc(2.5rem + 1px) !important;
    margin: 0.5rem;
  }
`

export const HeaderFlex = styled(Flex)`
  min-height: 33px;
`

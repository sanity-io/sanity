import {Box, Flex} from '@sanity/ui'
import styled from 'styled-components'

export const Root = styled(Box)`
  user-select: none;
`

export const ContentWrapper = styled(Box)``

export const Header = styled(Flex)`
  flex-grow: 1;
`

export const MediaWrapper = styled(Box)`
  height: calc(2.5rem + 1px);
  width: calc(2.5rem + 1px);
  min-width: calc(2.5rem + 1px);
  position: relative;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
  }

  svg {
    display: block;
    width: calc(2.5rem + 1px) !important;
    height: calc(2.5rem + 1px) !important;
  }
`

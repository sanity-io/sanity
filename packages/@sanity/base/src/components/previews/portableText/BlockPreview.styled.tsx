import {Box, Flex} from '@sanity/ui'
import styled from 'styled-components'

export const ContentWrapper = styled(Box)``

export const Header = styled(Flex)`
  flex-grow: 1;
`

export const MediaWrapper = styled(Box)`
  height: 33px;
  width: 33px;
  min-width: 33px;
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
    width: 29px;
    height: 29px;
    margin: 2px;
  }
`

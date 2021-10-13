import {Box, Card, Flex} from '@sanity/ui'
import styled from 'styled-components'

export const HeaderFlex = styled(Flex)`
  box-shadow: 0 0 0 1px var(--card-border-color);
  min-height: 35px;
`

export const MediaCard = styled(Card)<{$ratio: number}>`
  padding-bottom: ${({$ratio}) => $ratio}%;
  position: relative;

  svg {
    display: none;
  }

  img {
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    object-fit: contain;
  }
`

export const RootBox = styled(Box)`
  border-radius: ${({theme}) => theme.sanity.radius[1]}px;
`

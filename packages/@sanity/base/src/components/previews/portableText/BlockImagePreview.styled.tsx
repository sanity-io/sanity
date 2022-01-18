import {Box, Card, Flex, rem} from '@sanity/ui'
import styled from 'styled-components'
import {PREVIEW_MEDIA_SIZE} from '../constants'

export const HeaderFlex = styled(Flex).attrs({align: 'center'})`
  box-shadow: 0 0 0 1px var(--card-border-color);
  height: ${rem(PREVIEW_MEDIA_SIZE.block.height)};
  white-space: nowrap;
  position: relative;
  z-index: 1;
`

export const MediaCard = styled(Card)<{$ratio: number}>`
  position: relative;
  padding-bottom: ${({$ratio}) => $ratio}%;

  & > span {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }
`

export const RootBox = styled(Box).attrs({overflow: 'hidden'})`
  border-radius: ${({theme}) => theme.sanity.radius[1]}px;
`

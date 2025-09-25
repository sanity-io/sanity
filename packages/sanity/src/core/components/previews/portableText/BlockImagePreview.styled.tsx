import {Box, Card, Flex} from '@sanity/ui'
import {vars} from '@sanity/ui/css'
import {styled} from 'styled-components'

import {PREVIEW_SIZES} from '../constants'

export const HeaderFlex = styled(Flex).attrs({align: 'center'})`
  height: ${PREVIEW_SIZES.block.media.height}px;
  white-space: nowrap;
  position: relative;
  z-index: 1;
`

export const MediaCard = styled(Card)<{$ratio: number}>`
  overflow: hidden;
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
  border-radius: ${vars.radius[1]};
`

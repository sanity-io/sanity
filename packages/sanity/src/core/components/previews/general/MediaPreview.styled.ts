import {Box, Card, Flex, rem, Skeleton, Stack} from '@sanity/ui'
import styled from 'styled-components'

export const RootBox = styled(Box)`
  position: relative;
`

export const MediaFlex = styled(Flex).attrs({align: 'center', justify: 'center'})`
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
`

export const MediaSkeleton = styled(Skeleton).attrs({animated: true, radius: 2})`
  width: 100%;
  height: 100%;
`

export const ProgressFlex = styled(Flex).attrs({align: 'center', justify: 'center'})`
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;

  &:before {
    background-color: var(--card-bg-color);
    opacity: 0.75;
    content: '';
    display: block;
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
  }

  > svg {
    position: relative;
    z-index: 2;
  }
`

export const TooltipContentStack = styled(Stack).attrs({space: 2})`
  max-width: ${rem(200)};
`

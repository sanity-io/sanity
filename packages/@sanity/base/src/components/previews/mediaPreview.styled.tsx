import {Box, Flex, rem} from '@sanity/ui'
import styled from 'styled-components'

export const MediaWrapper = styled(Flex)`
  position: absolute !important;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  background-color: var(--card-hairline-hard-color);
  border-radius: ${({theme}) => rem(theme.sanity.radius[2])};

  img {
    display: block;
    width: 100%;
    height: auto;
    pointer-events: none;
  }

  &::after {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
    box-shadow: inset 0 0 0 1px var(--card-shadow-umbra-color);
    border-radius: ${({theme}) => rem(theme.sanity.radius[2])};
  }
`

export const Root = styled(Box)`
  position: relative;
`

export const MediaString = styled(Flex)`
  position: absolute;
  width: 100%;
  height: 100%;
  white-space: nowrap;
  max-width: 100%;
`

export const ProgressWrapper = styled(Flex)`
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  display: flex;

  > * {
    position: relative;
    z-index: 2;
  }

  &:before {
    background-color: var(--card-bg-color);
    opacity: 0.7;
    content: '';
    display: block;
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
  }
`

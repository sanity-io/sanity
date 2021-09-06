import {Box, Flex, rem} from '@sanity/ui'
import styled from 'styled-components'

export const MediaWrapper = styled(Flex)`
  position: absolute !important;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
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
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    box-shadow: inset 0 0 0 1px var(--card-shadow-umbra-color);
    border-radius: ${({theme}) => rem(theme.sanity.radius[2])};
  }
`

export const Root = styled(Box)`
  position: relative;
  overflow: hidden;
  width: 100%;
`

export const Progress = styled(Flex).attrs({justify: 'center', align: 'center'})`
  position: absolute;
  width: 100%;
  height: 100%;

  &:before {
    background-color: var(--card-bg-color);
    content: '';
    display: block;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
  }
`

export const MediaString = styled(Flex)`
  position: absolute;
  width: 100%;
  height: 100%;
  white-space: nowrap;
  max-width: 100%;
`

export const ProgressWrapper = styled(Box)`
  position: absolute;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: color(var(--component-bg) a(70%));
`

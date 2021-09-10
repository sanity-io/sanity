import {Box, Flex, Stack} from '@sanity/ui'
import styled from 'styled-components'

export const Root = styled(Flex)`
  user-select: none;
  height: 5em;
  box-sizing: border-box;
  max-width: 100%;
  position: relative;
`

export const Top = styled(Flex)`
  min-width: 0;
`

export const Header = styled(Stack)`
  min-width: 0;
`

export const MediaWrapper = styled(Flex)`
  flex-basis: 5em;
  flex-grow: 1;
  min-width: 5em;
  width: 5em;
  max-width: 5em;
  overflow: hidden;
  position: relative;

  img {
    display: block;
    width: 5em;
    height: 5em;
    object-fit: contain;
  }

  svg {
    font-size: 3rem;
    color: inherit;
  }
`

export const MediaString = styled(Box)``

export const StatusWrapper = styled(Box)`
  white-space: nowrap;
`

export const Content = styled(Flex)`
  flex-grow: 1;
  min-width: 0;

  > * {
    min-width: 0;
  }
`

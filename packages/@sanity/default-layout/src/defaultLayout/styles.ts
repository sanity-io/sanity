import styled, {css} from 'styled-components'
import {Box, Flex} from '@sanity/ui'

export const RootFlex = styled(Flex)<{$isOverlayVisible: boolean}>`
  ${({$isOverlayVisible}) =>
    $isOverlayVisible &&
    css`
      overflow: hidden;
    `}

  @media (min-width: ${({theme}) => theme.sanity.media[1]}px) {
    overflow: hidden;
    width: 100%;
  }
`

export const MainAreaFlex = styled(Flex)`
  position: relative;
`

export const PortalBox = styled(Box)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
`

export const ToolBox = styled(Box)`
  position: relative;
  min-width: 0;

  @media (min-width: ${({theme}) => theme.sanity.media[1]}px) {
    overflow: auto;
  }
`

export const SidecarBox = styled(Box)`
  position: relative;

  @media (max-width: ${({theme}) => theme.sanity.media[1]}px) {
    display: none;
  }

  @media (min-width: ${({theme}) => theme.sanity.media[1]}px) {
    width: 420px;

    &:empty {
      display: none;
    }
  }
`

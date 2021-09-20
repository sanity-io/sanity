import styled, {css} from 'styled-components'
import {Box, Flex} from '@sanity/ui'

export const RootFlex = styled(Flex)<{$isOverlayVisible: boolean}>`
  ${({$isOverlayVisible}) =>
    $isOverlayVisible &&
    css`
      overflow: hidden;
    `}

  min-height: 100%;

  @media (min-width: ${({theme}) => theme.sanity.media[2]}px) {
    overflow: hidden;
    width: 100%;
    height: 100%;
  }

  @media (max-width: ${({theme}) => theme.sanity.media[2] - 1}px) {
    & > * {
      min-height: auto;
    }
  }
`

export const MainAreaFlex = styled(Flex)`
  position: relative;
  min-height: auto;
`

export const ToolBox = styled(Box)`
  position: relative;
  height: auto;

  @media (min-width: ${({theme}) => theme.sanity.media[2]}px) {
    overflow: auto;
  }
`

export const SidecarBox = styled.div`
  position: relative;

  @media (max-width: ${({theme}) => theme.sanity.media[2] - 1}px) {
    display: none;
  }

  @media (min-width: ${({theme}) => theme.sanity.media[2]}px) {
    width: 420px;

    &:empty {
      display: none;
    }
  }
`

export const PortalDiv = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100%;
  flex: 1;
`

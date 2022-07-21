import styled, {css} from 'styled-components'
import {Flex} from '@sanity/ui'

export const RootFlex = styled(Flex)<{$isOverlayVisible: boolean}>`
  ${({$isOverlayVisible}) =>
    $isOverlayVisible &&
    css`
      overflow: hidden;
    `}

  @media (max-width: ${({theme}) => theme.sanity.media[0] - 1}px) {
    min-height: 100%;

    & > * {
      min-height: auto;
    }
  }

  @media (min-width: ${({theme}) => theme.sanity.media[0]}px) {
    overflow: hidden;
    width: 100%;
    height: 100%;
  }
`

export const MainAreaFlex = styled(Flex)`
  position: relative;
`

export const ToolBox = styled(Flex)`
  position: relative;

  @media (max-width: ${({theme}) => theme.sanity.media[0] - 1}px) {
    min-height: 100%;
  }

  @media (min-width: ${({theme}) => theme.sanity.media[0]}px) {
    overflow: auto;

    & > * {
      min-height: auto;
    }
  }
`

export const SidecarBox = styled.div`
  position: relative;

  @media (max-width: ${({theme}) => theme.sanity.media[0] - 1}px) {
    display: none;
  }

  @media (min-width: ${({theme}) => theme.sanity.media[0]}px) {
    width: 420px;

    &:empty {
      display: none;
    }
  }
`

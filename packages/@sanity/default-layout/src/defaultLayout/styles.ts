import styled, {css} from 'styled-components'
import {Box, Flex} from '@sanity/ui'

export const Root = styled(Flex)<{$isOverlayVisible: boolean}>`
  box-sizing: border-box;
  height: 100%;
  display: flex;
  flex-direction: column;

  ${({$isOverlayVisible}) =>
    $isOverlayVisible &&
    css`
      overflow: hidden;
      height: 100%;
    `}

  @media (min-width: ${({theme}) => theme.sanity.media[1]}px) {
    overflow: hidden;
    width: 100%;
    height: 100%;
  }
`

export const MainArea = styled(Flex)<{$isOverlayVisible: boolean}>`
  flex: 1;
  min-height: 0;
  position: relative;

  ${({$isOverlayVisible}) =>
    $isOverlayVisible &&
    css`
      overflow: hidden;
      height: 100%;
    `}
`

export const PortalBox = styled(Box)`
  position: absolute;
  inset: 0;
`

export const ToolContainer = styled.div`
  position: relative;
  flex: 1;
  min-width: 0;
  height: 100%;

  @media (min-width: ${({theme}) => theme.sanity.media[1]}px) {
    overflow: auto;
  }
`

export const SidecarContainer = styled.div`
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

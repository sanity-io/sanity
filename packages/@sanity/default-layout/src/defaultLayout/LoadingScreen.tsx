import {Layer} from '@sanity/ui'
import AppLoadingScreen from 'part:@sanity/base/app-loading-screen'
import React from 'react'
import styled, {css, keyframes} from 'styled-components'

const fadeOut = keyframes`
  0% {
    opacity: 1;
  }

  100% {
    opacity: 0;
  }

`

const Root = styled(Layer)<{$loaded: boolean}>`
  position: fixed;

  ${({$loaded}) =>
    $loaded &&
    css`
      transition: opacity 0.5s linear;
      animation-name: ${fadeOut};
      animation-duration: 1s;
      animation-delay: 1s;
    `}
`

export const LoadingScreen = React.forwardRef(function LoadingScreen(
  props: {loaded: boolean},
  ref: React.Ref<HTMLDivElement>
) {
  const {loaded} = props

  return (
    <Root zOffset={600000} $loaded={loaded} ref={ref}>
      <AppLoadingScreen text="Restoring Sanity Studio" />
    </Root>
  )
})

import {SyncIcon} from '@sanity/icons'
import styled, {keyframes} from 'styled-components'

const rotateAnimation = keyframes`
  0% {
    transform: rotate(0);
  }
  100% {
    transform: rotate(360deg);
  }

`

export const AnimatedSyncIcon = styled(SyncIcon)`
  transition: opacity 200ms;
  animation-name: ${rotateAnimation};
  animation-duration: 1000ms;
  animation-timing-function: ease-in-out;
  animation-iteration-count: infinite;
`

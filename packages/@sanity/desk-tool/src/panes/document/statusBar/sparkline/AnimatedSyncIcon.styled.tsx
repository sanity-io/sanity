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
  animation-duration: 1500ms;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
`

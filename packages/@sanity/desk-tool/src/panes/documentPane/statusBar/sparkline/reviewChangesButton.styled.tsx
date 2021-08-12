import {Box, Button} from '@sanity/ui'
import styled, {keyframes} from 'styled-components'

const rotateAnimation = keyframes`
  0% {
    transform: rotate(0);
  }
  100% {
    transform: rotate(360deg);
  }
`

export const Root = styled(Button)`
  transition: opacity 200ms;

  & [data-spin] {
    animation-name: ${rotateAnimation};
    animation-duration: 1500ms;
    animation-timing-function: linear;
    animation-iteration-count: infinite;
  }

  /* &[data-transition='out'] {
    pointer-events: none;
    opacity: 0;
  } */

  & [data-icon-hovered] {
    display: none;
  }

  &[data-selected] {
    & [data-icon-enabled] {
      display: none;
    }

    & [data-icon-hovered] {
      display: inline-flex;
    }
  }

  @media (hover: hover) {
    &:not(:disabled):not([data-selected]):hover {
      & [data-icon-enabled] {
        display: none;
      }

      & [data-icon-hovered] {
        display: inline-flex;
      }
    }
  }
`

export const TextBox = styled(Box)`
  margin-top: -3px;
  margin-bottom: -4px;
  margin-right: -4px;
`

import styled, {keyframes} from 'styled-components'

export const Root = styled.svg`
  background: transparent;
`
export const RightCircle = styled.path`
  stroke: red;
`

export const IncompleteCircle = styled.path`
  stroke: blue;
  opacity: 0.5;
`

const sync = keyframes`
  0% {
    transform: rotate(0);
  }
  100% {
    transform: rotate(360deg);
  }
`
const bounce = keyframes`
  0% { transform: scale(1); }
  20% { transform: scale(0.95) }
  40% { transform: scale(1.25) }
  60% { transform: scale(0.9) }
  80% { transform: scale(1.1) }
  100% { transform: scale(1); }
`

export const Saving = styled.g`
  animation: ${sync} 1s infinite;
  transform-origin: center;
  animation-timing-function: cubic-bezier(0.44, 0.31, 0.59, 0.75);
`

export const Circle = styled.path`
  stroke-dasharray: 23 3;
  stroke-dashoffset: 28;
  opacity: 0;
  transition: stroke-dasharray 1s, opacity 0.4s;
  transform-origin: center;
  &[data-state='saving'] {
    opacity: 1;
  }
  &[data-state='saved'] {
    opacity: 1;
    stroke-dasharray: 26 0;
    animation: ${bounce} 1s;
  }
`

export const Arrows = styled.path`
  transition: 0.5s;
  opacity: 0;
  &[data-state='saving'] {
    opacity: 1;
  }
`

export const EditIcon = styled.path`
  transition: 0.5s;
  opacity: 0;
  &[data-state='default'] {
    opacity: 1;
    transition-delay: 0.5s;
  }
`

export const Checkmark = styled.path`
  stroke-dasharray: 10;
  stroke-dashoffset: 30;
  transition: 0.5s;
  &[data-state='saved'] {
    transition: 1s;
    transition-delay: 0.5s;
    stroke-dashoffset: 20;
  }
`

import {keyframes} from 'styled-components'

export const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`

export const zoomIn = keyframes`
  from {
    opacity: 0;
    transform: perspective(1px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: perspective(1px) scale(1);
  }
`

import {styled} from 'styled-components'

export const Scroller = styled.div`
  position: relative;
  height: 100%;
  overflow: auto;
  scroll-behavior: smooth;
  scrollbar-width: var(--scrollbar-width);
  overscroll-behavior: contain;
  will-change: scroll-position;
`

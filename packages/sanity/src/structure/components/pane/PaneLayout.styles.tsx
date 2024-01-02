import {Card} from '@sanity/ui'
import styled from 'styled-components'

export const Root = styled(Card)`
  transition: opacity 200ms;
  position: relative;
  z-index: 1;
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
  opacity: 0;

  &:not([hidden]) {
    display: flex;
  }

  &:not([data-collapsed]) {
    overflow: auto;
  }

  &[data-mounted] {
    opacity: 1;
  }

  &[data-resizing] {
    pointer-events: none;
  }
`

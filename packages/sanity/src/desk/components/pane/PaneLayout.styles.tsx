import {Card} from '@sanity/ui'
import styled from 'styled-components'

export const Root = styled(Card)`
  transition: opacity 200ms;
  position: relative;
  z-index: 1;
  padding: 0 8px 8px 8px;
  opacity: 0;
  gap: 8px;

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

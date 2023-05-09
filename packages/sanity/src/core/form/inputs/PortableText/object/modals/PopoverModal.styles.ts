import {Box, Container, Flex, Popover} from '@sanity/ui'
import styled from 'styled-components'

export const RootPopover = styled(Popover)`
  &[data-popper-reference-hidden='true'] {
    visibility: hidden;
    pointer-events: none;
  }

  & > div {
    overflow: hidden;
    overflow: clip;
  }
`

export const ContentContainer = styled(Container)`
  &:not([hidden]) {
    display: flex;
  }
  direction: column;
`
/*
Setting a static max-height here to avoid scrolling issue.
Calculating a dynamic height to make the popover more responsive is complex, as the popover can switch top/bottom placement,
with different height requirements.
*/
export const ModalWrapper = styled(Flex)`
  max-height: 300px;
`

export const ContentScrollerBox = styled(Box)`
  /* Prevent overflow caused by change indicator */
  overflow-x: hidden;
  overflow-y: auto;
`

export const ContentHeaderBox = styled(Box)`
  box-shadow: 0 1px 0 var(--card-shadow-outline-color);
  position: relative;
  z-index: 10;
  min-height: auto;
`

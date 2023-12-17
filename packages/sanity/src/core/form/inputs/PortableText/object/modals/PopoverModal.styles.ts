import {Box} from '@sanity/ui'
import styled from 'styled-components'
import {Popover} from '../../../../../ui-components'

export const RootPopover = styled(Popover)`
  & > div {
    overflow: hidden;
    overflow: clip;
  }
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

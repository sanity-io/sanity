import {Box} from '@sanity/ui'
import {vars} from '@sanity/ui/css'
import {styled} from 'styled-components'

import {Popover} from '../../../../../../ui-components'

export const RootPopover = styled(Popover)`
  [data-ui='Popover__wrapper'] {
    overflow: auto;
    max-height: 60vh;
  }
`

export const ContentScrollerBox = styled(Box)`
  /* Prevent overflow caused by change indicator */
  overflow-x: hidden;
`

export const ContentHeaderBox = styled(Box)`
  box-shadow: 0 1px 0 ${vars.color.shadow.outline};
  position: relative;
  z-index: 10;
  min-height: auto;
`

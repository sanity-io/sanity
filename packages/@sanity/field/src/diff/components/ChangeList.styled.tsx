import {Popover} from '@sanity/ui'
import styled from 'styled-components'

export const ChangeListWrapper = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
`

export const PopoverWrapper = styled(Popover)`
  /* needed to keep this z-index from the previous implementation in order for the popover to appear
  * on top of the DocumentStatusBar at the bottom */
  z-index: 20300 !important;
`

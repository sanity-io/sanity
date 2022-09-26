import {Popover} from '@sanity/ui'
import styled from 'styled-components'

export const ChangeListWrapper = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
`

export const PopoverWrapper = styled(Popover)`
  /* hides the popover when the target of it has left the visible part of the window.
   without it, the popover will be on top of the headers (document title & changes)
   and footers (changed notifications, publish button etc)*/
  &[data-popper-reference-hidden='true'] {
    display: none;
  }
`

import {Popover} from '@sanity/ui'
import styled from 'styled-components'

export const ChangeListWrapper = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
`

export const PopoverWrapper = styled(Popover)`
  &[data-popper-reference-hidden='true'] {
    display: none;
  }
`

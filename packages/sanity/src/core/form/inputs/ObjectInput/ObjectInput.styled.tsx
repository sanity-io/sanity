import {Card, Grid} from '@sanity/ui'
import {vars} from '@sanity/ui/css'
import {styled} from 'styled-components'

// The negative margins here removes the extra space between the tabs and the fields when inside of a grid
export const FieldGroupTabsWrapper = styled(Card)<{$level?: number}>`
  margin-bottom: ${({$level}) => ($level === 0 ? 0 : `calc(0 - ${vars.space[5]})`)};
  padding-bottom: ${({$level}) => ($level === 0 ? vars.space[4] : vars.space[4])};
`

export const AlignedBottomGrid = styled(Grid)`
  align-items: flex-end;
`
